const { Reminder, NotificationSetting, Cycle, Appointment, Medication, Op } = require("../models");
const ApiError = require("../utils/ApiError");
const notify = require("../utils/notify");
const { addDays, today } = require("../utils/date");
const { FREE_LIMITS } = require("../config/plans");

const SETTING_FOR_TYPE = {
  period: "periodNotifications",
  pregnancy: "pregnancyNotifications",
  medication: "medicationNotifications",
  appointment: "appointmentNotifications",
  wellness: "wellnessNotifications",
  custom: null,
};

const upgradeError = (message) => {
  const err = new ApiError(403, message);
  err.upgradeRequired = true;
  return err;
};

// ---------- User CRUD ----------

const createReminder = async (userId, data, isPremium = false) => {
  // Advanced reminders & notifications is a premium feature
  if (!isPremium) {
    const active = await Reminder.count({ where: { userId, completed: false, automatic: false } });
    if (active >= FREE_LIMITS.activeReminders) {
      throw upgradeError(`Free accounts can have ${FREE_LIMITS.activeReminders} active reminders. Upgrade for unlimited.`);
    }
    if (data.repeat && data.repeat !== "none") throw upgradeError("Repeating reminders are a Premium feature");
  }
  return Reminder.create({ ...data, userId, automatic: false });
};

// ?type=&completed=true|false&upcoming=true
const getReminders = (userId, { type, completed, upcoming } = {}) => {
  const where = { userId };
  if (type) where.type = type;
  if (completed !== undefined) where.completed = completed === "true";
  if (upcoming === "true") { where.date = { [Op.gte]: today() }; where.completed = false; }
  return Reminder.findAll({ where, order: [["date", "ASC"], ["time", "ASC"]] });
};

const getReminder = async (userId, id) => {
  const r = await Reminder.findOne({ where: { id, userId } });
  if (!r) throw new ApiError(404, "Reminder not found");
  return r;
};

const updateReminder = async (userId, id, data, isPremium = false) => {
  const r = await getReminder(userId, id);
  if (!isPremium && !r.automatic && data.repeat && data.repeat !== "none" && data.repeat !== r.repeat) {
    throw upgradeError("Repeating reminders are a Premium feature");
  }
  // A new date or time means it should fire again
  const moved = (data.date && data.date !== r.date) || (data.time && data.time !== r.time);
  return r.update({ ...data, ...(moved && { lastSentAt: null }) });
};

const deleteReminder = async (userId, id) => {
  await (await getReminder(userId, id)).destroy();
  return true;
};

const toggleComplete = async (userId, id) => {
  const r = await getReminder(userId, id);
  return r.update({ completed: !r.completed });
};

// ---------- Firing (runs every minute) ----------

// Reminder date+time as a real Date. Server runs in UTC, which is Ghana time.
const scheduledAt = (r) => new Date(`${r.date}T${r.time.slice(0, 5)}:00`);

const nextDate = (date, repeat) => {
  const d = new Date(date);
  if (repeat === "daily") d.setUTCDate(d.getUTCDate() + 1);
  if (repeat === "weekly") d.setUTCDate(d.getUTCDate() + 7);
  if (repeat === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
};

const DEFAULT_SETTINGS = { notificationsEnabled: true, reminderLeadMinutes: 0, quietHoursEnabled: false };

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
};

// Handles windows that cross midnight, e.g. 22:00 → 07:00
const inQuietHours = (s, now) => {
  if (!s.quietHoursEnabled || !s.quietHoursStart || !s.quietHoursEnd) return false;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(s.quietHoursStart);
  const end = toMinutes(s.quietHoursEnd);
  if (start === end) return false;
  return start < end ? nowMin >= start && nowMin < end : nowMin >= start || nowMin < end;
};

const typeAllowed = (s, type) => {
  if (!s.notificationsEnabled) return false;
  const key = SETTING_FOR_TYPE[type];
  return key ? s[key] !== false : true;
};

const fireDueReminders = async () => {
  const now = new Date();
  // Include tomorrow's reminders so "1 day before" can fire today
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const candidates = await Reminder.findAll({ where: { completed: false, date: { [Op.lte]: tomorrow } } });

  const cache = new Map();
  const settingsFor = async (userId) => {
    if (!cache.has(userId)) {
      const s = await NotificationSetting.findOne({ where: { userId } });
      cache.set(userId, s ? s.toJSON() : DEFAULT_SETTINGS);
    }
    return cache.get(userId);
  };

  let fired = 0;
  for (const r of candidates) {
    const s = await settingsFor(r.userId);
    const lead = Number(s.reminderLeadMinutes) || 0;
    const at = new Date(scheduledAt(r).getTime() - lead * 60000);

    if (at > now) continue; // not yet
    if (r.lastSentAt && new Date(r.lastSentAt) >= at) continue; // already sent for this slot

    const allowed = typeAllowed(s, r.type);
    if (allowed && inQuietHours(s, now)) continue; // hold it until quiet hours end

    if (allowed) {
      await notify(r.userId, {
        title: r.title,
        body: r.notes || "",
        type: r.type === "custom" ? "system" : r.type,
        data: { reminderId: r.id, referenceId: r.referenceId },
      });
      fired++;
    }

    const updates = { lastSentAt: now };
    if (r.repeat !== "none") {
      let d = nextDate(r.date, r.repeat); // always move at least one slot
      while (d < today()) d = nextDate(d, r.repeat); // skip any missed ones
      updates.date = d;
    }
    await r.update(updates);
  }
  return fired;
};

// ---------- Automatic reminders (runs hourly, or per user on demand) ----------

// Create or refresh one automatic reminder. `defaults` are only used on first creation.
const upsertAuto = async (key, values, defaults = {}) => {
  const [r, created] = await Reminder.findOrCreate({
    where: { ...key, automatic: true, completed: false },
    defaults: { ...key, ...values, ...defaults, automatic: true },
  });
  if (!created) await r.update(values);
  return r;
};

const PLACEHOLDER = "00000000-0000-0000-0000-000000000000"; // Op.notIn can't take an empty list

const syncAutomaticReminders = async (userId = null) => {
  const scope = userId ? { userId } : {};

  // 1. Period expected (latest cycle per user)
  const cycles = await Cycle.findAll({
    where: { ...scope, predictedNextStart: { [Op.gte]: today() } },
    order: [["userId", "ASC"], ["startDate", "DESC"]],
  });
  const seen = new Set();
  for (const c of cycles) {
    if (seen.has(c.userId)) continue;
    seen.add(c.userId);
    await upsertAuto(
      { userId: c.userId, type: "period" },
      { referenceId: c.id, title: "Your period is expected today", notes: "Based on your cycle history", date: c.predictedNextStart, time: "08:00" }
    );
  }

  // 2. Appointments in the next 14 days (booked AND personal) → the day before at 09:00
  const appointments = await Appointment.findAll({
    where: {
      ...scope,
      status: ["pending", "confirmed", "rescheduled"],
      scheduledAt: { [Op.between]: [new Date(), new Date(Date.now() + 14 * 86400000)] },
    },
    include: [{ association: "professional", attributes: ["name"] }],
  });
  for (const a of appointments) {
    const dayBefore = addDays(a.scheduledAt, -1);
    const who = (a.professional && a.professional.name) || a.providerName || "your provider";
    const when = new Date(a.scheduledAt).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    await upsertAuto(
      { userId: a.userId, type: "appointment", referenceId: a.id },
      { title: `Appointment with ${who}`, notes: `${when}${a.location ? ` · ${a.location}` : ""}`, date: dayBefore < today() ? today() : dayBefore, time: "09:00" }
    );
  }
  const liveAppointmentIds = appointments.map((a) => a.id);
  await Reminder.destroy({
    where: { ...scope, type: "appointment", automatic: true, referenceId: { [Op.notIn]: liveAppointmentIds.length ? liveAppointmentIds : [PLACEHOLDER] } },
  });

  // 3. Active medications → daily reminder at each time
  const medications = await Medication.findAll({
    where: { ...scope, isActive: true, [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: today() } }] },
  });
  for (const m of medications) {
    for (const time of m.times || []) {
      await upsertAuto(
        { userId: m.userId, type: "medication", referenceId: m.id, time },
        { title: `Take ${m.name}${m.dosage ? ` (${m.dosage})` : ""}`, notes: m.notes || "", repeat: "daily" },
        { date: m.startDate && m.startDate > today() ? m.startDate : today() }
      );
    }
  }
  const liveMedicationIds = medications.map((m) => m.id);
  await Reminder.destroy({
    where: { ...scope, type: "medication", automatic: true, referenceId: { [Op.notIn]: liveMedicationIds.length ? liveMedicationIds : [PLACEHOLDER] } },
  });

  return true;
};

module.exports = { createReminder, getReminders, getReminder, updateReminder, deleteReminder, toggleComplete, fireDueReminders, syncAutomaticReminders };