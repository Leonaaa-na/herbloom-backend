const { Appointment, AppointmentHistory, Professional, Op } = require("../models");
const ApiError = require("../utils/ApiError");
const notify = require("../utils/notify");
const { sendEmail } = require("../config/mailer");

const UPCOMING = ["pending", "confirmed", "rescheduled"];
const INCLUDE = [
  { association: "professional", attributes: ["id", "name", "title", "specialty", "hospital", "address", "city", "phone", "avatarUrl", "consultationFee", "userId"] },
  { association: "patient", attributes: ["id", "name", "email", "phone"] },
];

const fmt = (d) => new Date(d).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });

// Works for both booked and personal appointments
const providerOf = (appt) => (appt.professional && appt.professional.name) || appt.providerName || "your provider";
const proUserId = (appt) => (appt.professional ? appt.professional.userId : null);

// Who's allowed to touch this appointment?
const getAppointmentFor = async (user, id) => {
  const appt = await Appointment.findOne({
    where: { id },
    include: [...INCLUDE, { association: "history", separate: true, order: [["createdAt", "ASC"]] }],
  });
  if (!appt) throw new ApiError(404, "Appointment not found");
  const isPatient = appt.userId === user.id;
  const isPro = !!appt.professional && appt.professional.userId === user.id;
  if (!isPatient && !isPro && user.role !== "admin") throw new ApiError(403, "Not your appointment");
  return { appt, isPatient, isPro };
};

const addHistory = (appt, action, changedById, extra = {}) =>
  AppointmentHistory.create({ appointmentId: appt.id, action, changedById, ...extra });

const assertSlotFree = async (professionalId, scheduledAt, durationMinutes, ignoreId = null) => {
  const start = new Date(scheduledAt);
  if (start < new Date()) throw new ApiError(400, "Pick a time in the future");
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const clash = await Appointment.findOne({
    where: {
      professionalId,
      status: UPCOMING,
      ...(ignoreId && { id: { [Op.ne]: ignoreId } }),
      scheduledAt: { [Op.lt]: end, [Op.gt]: new Date(start.getTime() - 3 * 60 * 60000) },
    },
  });
  if (clash) {
    const clashEnd = new Date(new Date(clash.scheduledAt).getTime() + clash.durationMinutes * 60000);
    if (new Date(clash.scheduledAt) < end && clashEnd > start) throw new ApiError(409, "That time slot is already booked");
  }
};

// ---------- Patient: booking a registered professional ----------

const book = async (user, { professionalId, scheduledAt, durationMinutes = 30, type, context, reason, location }) => {
  const pro = await Professional.findOne({ where: { id: professionalId, verificationStatus: "verified" } });
  if (!pro) throw new ApiError(404, "Professional not found");
  if (!pro.isAvailable) throw new ApiError(400, "This professional isn't taking bookings right now");

  await assertSlotFree(professionalId, scheduledAt, durationMinutes);

  const appt = await Appointment.create({
    userId: user.id, professionalId, scheduledAt, durationMinutes, type, context, reason,
    location: location || pro.hospital,
  });
  await addHistory(appt, "booked", user.id, { newScheduledAt: scheduledAt });

  await notify(user.id, { title: "Appointment requested", body: `${pro.name} on ${fmt(scheduledAt)}`, type: "appointment", data: { appointmentId: appt.id } });
  await notify(pro.userId, { title: "New appointment request", body: `${user.name} on ${fmt(scheduledAt)}`, type: "appointment", data: { appointmentId: appt.id } });

  sendEmail({
    to: user.email,
    subject: "HerBloom appointment requested",
    html: `<p>Hi ${user.name},</p><p>Your appointment with <b>${pro.name}</b> (${pro.specialty}) is requested for <b>${fmt(scheduledAt)}</b>.</p><p>You'll get another notification once it's confirmed.</p>`,
  }).catch((e) => console.error("Appointment email failed:", e.message));

  return Appointment.findByPk(appt.id, { include: INCLUDE });
};

// ---------- Patient: personal appointment (any doctor/clinic, not in the app) ----------

const addPersonal = async (user, { providerName, scheduledAt, reason, notes, location, context = "general", type }) => {
  const appt = await Appointment.create({
    userId: user.id,
    professionalId: null,
    providerName,
    isPersonal: true,
    scheduledAt,
    reason,
    notes,
    location,
    context,
    type,
    status: "confirmed", // nobody else needs to approve it
  });
  await addHistory(appt, "booked", user.id, { newScheduledAt: scheduledAt });
  return Appointment.findByPk(appt.id, { include: INCLUDE });
};

// Personal appointments can be deleted outright; booked ones must be cancelled
const deletePersonal = async (user, id) => {
  const appt = await Appointment.findOne({ where: { id, userId: user.id } });
  if (!appt) throw new ApiError(404, "Appointment not found");
  if (!appt.isPersonal) throw new ApiError(400, "Booked appointments can't be deleted — cancel them instead");
  await appt.destroy();
  return true;
};

// ?status=upcoming|past|all  &context=pregnancy
const getMine = async (user, { status = "upcoming", context } = {}) => {
  const where = { userId: user.id };
  if (context) where.context = context;
  if (status === "upcoming") where.status = UPCOMING;
  if (status === "past") where.status = ["completed", "cancelled"];
  return Appointment.findAll({ where, include: INCLUDE, order: [["scheduledAt", status === "past" ? "DESC" : "ASC"]] });
};

const getOne = async (user, id) => (await getAppointmentFor(user, id)).appt;

const reschedule = async (user, id, { scheduledAt, reason }) => {
  const { appt } = await getAppointmentFor(user, id);
  if (!UPCOMING.includes(appt.status)) throw new ApiError(400, "Only upcoming appointments can be rescheduled");

  // Only booked appointments compete for a professional's time
  if (!appt.isPersonal) await assertSlotFree(appt.professionalId, scheduledAt, appt.durationMinutes, appt.id);

  const previous = appt.scheduledAt;
  await appt.update({
    previousScheduledAt: previous,
    scheduledAt,
    status: appt.isPersonal ? "confirmed" : "rescheduled",
  });
  await addHistory(appt, "rescheduled", user.id, { previousScheduledAt: previous, newScheduledAt: scheduledAt, reason });

  const other = user.id === appt.userId ? proUserId(appt) : appt.userId;
  await notify(other, { title: "Appointment rescheduled", body: `Now on ${fmt(scheduledAt)}`, type: "appointment", data: { appointmentId: appt.id } });

  return getOne(user, id);
};

const cancel = async (user, id, { reason } = {}) => {
  const { appt } = await getAppointmentFor(user, id);
  if (!UPCOMING.includes(appt.status)) throw new ApiError(400, "This appointment can't be cancelled");

  await appt.update({ status: "cancelled", cancellationReason: reason || null });
  await addHistory(appt, "cancelled", user.id, { reason });

  const other = user.id === appt.userId ? proUserId(appt) : appt.userId;
  await notify(other, { title: "Appointment cancelled", body: `${fmt(appt.scheduledAt)}${reason ? ` — ${reason}` : ""}`, type: "appointment", data: { appointmentId: appt.id } });

  return getOne(user, id);
};

// ---------- Professional / admin ----------

const confirm = async (user, id) => {
  const { appt, isPatient } = await getAppointmentFor(user, id);
  if (isPatient && user.role !== "admin") throw new ApiError(403, "Only the professional can confirm");
  if (!["pending", "rescheduled"].includes(appt.status)) throw new ApiError(400, "Nothing to confirm");

  await appt.update({ status: "confirmed" });
  await addHistory(appt, "confirmed", user.id);
  await notify(appt.userId, { title: "Appointment confirmed", body: `${providerOf(appt)} on ${fmt(appt.scheduledAt)}`, type: "appointment", data: { appointmentId: appt.id } });
  return getOne(user, id);
};

const complete = async (user, id, { notes } = {}) => {
  const { appt, isPatient } = await getAppointmentFor(user, id);
  // Patients can mark their own personal appointments as done
  if (isPatient && !appt.isPersonal && user.role !== "admin") throw new ApiError(403, "Only the professional can complete");
  if (!UPCOMING.includes(appt.status)) throw new ApiError(400, "This appointment can't be completed");

  await appt.update({ status: "completed", ...(notes && { notes }) });
  await addHistory(appt, "completed", user.id);
  if (!appt.isPersonal) {
    await notify(appt.userId, { title: "Appointment completed", body: `Thanks for visiting ${providerOf(appt)}`, type: "appointment", data: { appointmentId: appt.id } });
  }
  return getOne(user, id);
};

// The professional's own schedule
const getForProfessional = async (user, { status = "upcoming" } = {}) => {
  const pro = await Professional.findOne({ where: { userId: user.id } });
  if (!pro) throw new ApiError(404, "No professional profile");
  const where = { professionalId: pro.id };
  if (status === "upcoming") where.status = UPCOMING;
  if (status === "past") where.status = ["completed", "cancelled"];
  return Appointment.findAll({ where, include: INCLUDE, order: [["scheduledAt", "ASC"]] });
};

// Booked slots for a professional on a day → frontend greys them out
const getAvailability = async ({ professionalId, date }) => {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);
  const booked = await Appointment.findAll({
    where: { professionalId, status: UPCOMING, scheduledAt: { [Op.between]: [dayStart, dayEnd] } },
    attributes: ["scheduledAt", "durationMinutes"],
    order: [["scheduledAt", "ASC"]],
  });
  return { date, booked };
};

module.exports = {
  book, addPersonal, deletePersonal, getMine, getOne, reschedule, cancel,
  confirm, complete, getForProfessional, getAvailability,
};