const {
  Pregnancy, PregnancyHealthLog, BabyMovement, ContractionSession, Contraction,
  BirthPlan, PregnancyMilestone, BabyDevelopmentWeek, Profile, Op,
} = require("../models");
const ApiError = require("../utils/ApiError");
const { addDays, diffDays, today } = require("../utils/date");

// Every feature below works on the user's ACTIVE pregnancy
const getActive = async (userId) => {
  const pregnancy = await Pregnancy.findOne({ where: { userId, status: "active" } });
  if (!pregnancy) throw new ApiError(404, "No active pregnancy. Set one up first.");
  return pregnancy;
};

const weekFor = (pregnancy, date) => Math.max(0, Math.floor(diffDays(pregnancy.lastMenstrualPeriod, date) / 7));

// ---------- Setup / dashboard ----------

const setup = async (userId, { lastMenstrualPeriod, dueDate, babyNickname, isFirstPregnancy, notes }) => {
  const existing = await Pregnancy.findOne({ where: { userId, status: "active" } });
  if (existing) throw new ApiError(409, "You already have an active pregnancy");

  // Can set up from either date
  const lmp = lastMenstrualPeriod || (dueDate ? addDays(dueDate, -280) : null);
  if (!lmp) throw new ApiError(400, "Provide lastMenstrualPeriod or dueDate");

  const pregnancy = await Pregnancy.create({ userId, lastMenstrualPeriod: lmp, dueDate, babyNickname, isFirstPregnancy, notes });
  await Profile.update({ lifeStage: "pregnant" }, { where: { userId } });
  return pregnancy;
};

const getCurrent = async (userId) => {
  const pregnancy = await Pregnancy.findOne({ where: { userId, status: "active" } });
  if (!pregnancy) return null;

  const week = pregnancy.currentWeek;
  // Nearest seeded week at or below the current one
  const development = await BabyDevelopmentWeek.findOne({
    where: { week: { [Op.lte]: Math.max(week, 1) } },
    order: [["week", "DESC"]],
  });

  return {
    pregnancy,
    currentWeek: week,
    trimester: pregnancy.trimester,
    daysPregnant: diffDays(pregnancy.lastMenstrualPeriod, today()),
    daysUntilDue: diffDays(today(), pregnancy.dueDate),
    development,
  };
};

// Keep both dates in step: change one, the other follows (280 days apart)
const update = async (userId, data) => {
  const pregnancy = await getActive(userId);
  if (data.lastMenstrualPeriod && !data.dueDate) {
    data.dueDate = addDays(data.lastMenstrualPeriod, 280);
  } else if (data.dueDate && !data.lastMenstrualPeriod) {
    data.lastMenstrualPeriod = addDays(data.dueDate, -280);
  }
  return pregnancy.update(data);
};

// Baby's here → postpartum mode
const deliver = async (userId, { deliveryDate, deliveryType }) => {
  const pregnancy = await getActive(userId);
  await pregnancy.update({ status: "postpartum", deliveryDate: deliveryDate || today(), deliveryType });
  await Profile.update({ lifeStage: "postpartum" }, { where: { userId } });
  return pregnancy;
};

// Pregnancy ended for any other reason
const end = async (userId) => {
  const pregnancy = await getActive(userId);
  await pregnancy.update({ status: "ended", endedAt: today() });
  await Profile.update({ lifeStage: "menstrual" }, { where: { userId } });
  return pregnancy;
};

const getHistory = (userId) => Pregnancy.findAll({ where: { userId }, order: [["createdAt", "DESC"]] });

// ---------- Health logs (symptoms, severity, weight, BP) ----------

const createHealthLog = async (userId, data) => {
  const pregnancy = await getActive(userId);
  return PregnancyHealthLog.create({ ...data, userId, pregnancyId: pregnancy.id, week: weekFor(pregnancy, data.date) });
};

const getHealthLogs = async (userId) => {
  const pregnancy = await getActive(userId);
  return PregnancyHealthLog.findAll({
    where: { pregnancyId: pregnancy.id },
    order: [["date", "DESC"], ["createdAt", "DESC"]],
  });
};

const updateHealthLog = async (userId, id, data) => {
  const log = await PregnancyHealthLog.findOne({ where: { id, userId } });
  if (!log) throw new ApiError(404, "Log not found");
  return log.update(data);
};

const deleteHealthLog = async (userId, id) => {
  const log = await PregnancyHealthLog.findOne({ where: { id, userId } });
  if (!log) throw new ApiError(404, "Log not found");
  await log.destroy();
  return true;
};

// ---------- Baby movements (kick counter) ----------

const startMovementSession = async (userId) => {
  const pregnancy = await getActive(userId);
  return BabyMovement.create({ userId, pregnancyId: pregnancy.id });
};

const addKick = async (userId, id) => {
  const session = await BabyMovement.findOne({ where: { id, userId, endedAt: null } });
  if (!session) throw new ApiError(404, "Active session not found");
  return session.update({ kickCount: session.kickCount + 1 });
};

const endMovementSession = async (userId, id, { kickCount, notes } = {}) => {
  const session = await BabyMovement.findOne({ where: { id, userId } });
  if (!session) throw new ApiError(404, "Session not found");
  const endedAt = new Date();
  return session.update({
    endedAt,
    durationSeconds: Math.round((endedAt - new Date(session.startedAt)) / 1000),
    ...(kickCount !== undefined && { kickCount }),
    ...(notes !== undefined && { notes }),
  });
};

const getMovementSessions = async (userId) => {
  const pregnancy = await getActive(userId);
  return BabyMovement.findAll({ where: { pregnancyId: pregnancy.id }, order: [["startedAt", "DESC"]], limit: 30 });
};

const deleteMovementSession = async (userId, id) => {
  const session = await BabyMovement.findOne({ where: { id, userId } });
  if (!session) throw new ApiError(404, "Session not found");
  await session.destroy();
  return true;
};

// "Clear history" — every session for the current pregnancy
const clearMovementSessions = async (userId) => {
  const pregnancy = await getActive(userId);
  await BabyMovement.destroy({ where: { pregnancyId: pregnancy.id, userId } });
  return true;
};

// ---------- Contraction timer ----------

const startContractionSession = async (userId) => {
  const pregnancy = await getActive(userId);
  return ContractionSession.create({ userId, pregnancyId: pregnancy.id });
};

const addContraction = async (userId, sessionId, { startedAt, endedAt, intensity }) => {
  const session = await ContractionSession.findOne({ where: { id: sessionId, userId } });
  if (!session) throw new ApiError(404, "Session not found");

  const previous = await Contraction.findOne({ where: { sessionId }, order: [["startedAt", "DESC"]] });
  const start = new Date(startedAt || Date.now());

  return Contraction.create({
    sessionId,
    startedAt: start,
    endedAt: endedAt || null,
    intensity,
    durationSeconds: endedAt ? Math.round((new Date(endedAt) - start) / 1000) : null,
    intervalSeconds: previous ? Math.round((start - new Date(previous.startedAt)) / 1000) : null,
  });
};

const endContraction = async (userId, sessionId, contractionId) => {
  const session = await ContractionSession.findOne({ where: { id: sessionId, userId } });
  if (!session) throw new ApiError(404, "Session not found");
  const c = await Contraction.findOne({ where: { id: contractionId, sessionId } });
  if (!c) throw new ApiError(404, "Contraction not found");
  const endedAt = new Date();
  return c.update({ endedAt, durationSeconds: Math.round((endedAt - new Date(c.startedAt)) / 1000) });
};

const endContractionSession = async (userId, sessionId, { notes } = {}) => {
  const session = await ContractionSession.findOne({ where: { id: sessionId, userId } });
  if (!session) throw new ApiError(404, "Session not found");
  return session.update({ endedAt: new Date(), ...(notes !== undefined && { notes }) });
};

const getContractionSessions = async (userId) => {
  const pregnancy = await getActive(userId);
  return ContractionSession.findAll({ where: { pregnancyId: pregnancy.id }, order: [["startedAt", "DESC"]], limit: 20 });
};

// Session + its contractions + a summary (5-1-1 rule: every 5 min, lasting 1 min, for 1 hour)
const getContractionSession = async (userId, sessionId) => {
  const session = await ContractionSession.findOne({
    where: { id: sessionId, userId },
    include: [{ association: "contractions", separate: true, order: [["startedAt", "ASC"]] }],
  });
  if (!session) throw new ApiError(404, "Session not found");

  const all = session.contractions;
  const lastHour = all.filter((c) => Date.now() - new Date(c.startedAt) <= 60 * 60 * 1000);
  const avg = (arr, key) => {
    const vals = arr.map((c) => c[key]).filter((v) => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  const avgInterval = avg(lastHour, "intervalSeconds");
  const avgDuration = avg(lastHour, "durationSeconds");
  const sessionMinutes = Math.round((Date.now() - new Date(session.startedAt)) / 60000);

  return {
    session,
    summary: {
      total: all.length,
      lastHourCount: lastHour.length,
      averageIntervalSeconds: avgInterval,
      averageDurationSeconds: avgDuration,
      sessionMinutes,
      shouldGoToHospital:
        sessionMinutes >= 60 && lastHour.length >= 6 && avgInterval !== null && avgInterval <= 300 && avgDuration !== null && avgDuration >= 60,
    },
  };
};

// ---------- Birth plan ----------

const getBirthPlan = async (userId) => {
  const pregnancy = await getActive(userId);
  const [plan] = await BirthPlan.findOrCreate({ where: { pregnancyId: pregnancy.id }, defaults: { userId } });
  return plan;
};

const updateBirthPlan = async (userId, data) => {
  const plan = await getBirthPlan(userId);

  // Bag counts as packed when every item on the list is ticked
  if (Array.isArray(data.hospitalBagChecklist)) {
    const list = data.hospitalBagChecklist;
    data.hospitalBagPacked = list.length > 0 && list.every((item) => item.completed || item.packed);
  }

  return plan.update(data);
};

// ---------- Timeline milestones ----------

const createMilestone = async (userId, data) => {
  const pregnancy = await getActive(userId);
  return PregnancyMilestone.create({ ...data, userId, pregnancyId: pregnancy.id, week: weekFor(pregnancy, data.date) });
};

const getMilestones = async (userId) => {
  const pregnancy = await getActive(userId);
  return PregnancyMilestone.findAll({ where: { pregnancyId: pregnancy.id }, order: [["date", "ASC"]] });
};

const updateMilestone = async (userId, id, data) => {
  const m = await PregnancyMilestone.findOne({ where: { id, userId } });
  if (!m) throw new ApiError(404, "Milestone not found");
  return m.update(data);
};

const deleteMilestone = async (userId, id) => {
  const m = await PregnancyMilestone.findOne({ where: { id, userId } });
  if (!m) throw new ApiError(404, "Milestone not found");
  await m.destroy();
  return true;
};

// ---------- Baby development (reference data) ----------

const getAllWeeks = () => BabyDevelopmentWeek.findAll({ order: [["week", "ASC"]] });

const getWeek = async (week) => {
  const row = await BabyDevelopmentWeek.findOne({ where: { week: { [Op.lte]: week } }, order: [["week", "DESC"]] });
  if (!row) throw new ApiError(404, "No information for that week yet");
  return row;
};

module.exports = {
  setup, getCurrent, update, deliver, end, getHistory,
  createHealthLog, getHealthLogs, updateHealthLog, deleteHealthLog,
  startMovementSession, addKick, endMovementSession, getMovementSessions, deleteMovementSession, clearMovementSessions,
  startContractionSession, addContraction, endContraction, endContractionSession, getContractionSessions, getContractionSession,
  getBirthPlan, updateBirthPlan,
  createMilestone, getMilestones, updateMilestone, deleteMilestone,
  getAllWeeks, getWeek,
};