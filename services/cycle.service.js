const { Cycle, CycleLog, Profile, Op } = require("../models");
const ApiError = require("../utils/ApiError");
const { addDays, diffDays, today } = require("../utils/date");
const { FREE_LIMITS } = require("../config/plans");

const LUTEAL_PHASE_DAYS = 14; // ovulation is ~14 days before the next period

// Average of the last 6 real cycles → else profile default → else 28
const getAverageCycleLength = async (userId) => {
  const recent = await Cycle.findAll({
    where: { userId, cycleLength: { [Op.ne]: null } },
    order: [["startDate", "DESC"]],
    limit: 6,
  });
  if (recent.length) {
    return Math.round(recent.reduce((sum, c) => sum + c.cycleLength, 0) / recent.length);
  }
  const profile = await Profile.findOne({ where: { userId } });
  return profile?.averageCycleLength || 28;
};

const getAveragePeriodLength = async (userId) => {
  const recent = await Cycle.findAll({
    where: { userId, periodLength: { [Op.ne]: null } },
    order: [["startDate", "DESC"]],
    limit: 6,
  });
  if (recent.length) {
    return Math.round(recent.reduce((sum, c) => sum + c.periodLength, 0) / recent.length);
  }
  const profile = await Profile.findOne({ where: { userId } });
  return profile?.averagePeriodLength || 5;
};

const buildPredictions = (startDate, averageCycleLength) => {
  const predictedNextStart = addDays(startDate, averageCycleLength);
  const predictedOvulation = addDays(predictedNextStart, -LUTEAL_PHASE_DAYS);
  return {
    predictedNextStart,
    predictedOvulation,
    fertileWindowStart: addDays(predictedOvulation, -5),
    fertileWindowEnd: addDays(predictedOvulation, 1),
  };
};

// ---------- Cycles ----------

const createCycle = async (userId, { startDate, endDate, notes }) => {
  const duplicate = await Cycle.findOne({ where: { userId, startDate } });
  if (duplicate) throw new ApiError(409, "A cycle already starts on that date");

  // Close off the previous cycle: its length = days until this one started
  const previous = await Cycle.findOne({
    where: { userId, startDate: { [Op.lt]: startDate } },
    order: [["startDate", "DESC"]],
  });
  if (previous) await previous.update({ cycleLength: diffDays(previous.startDate, startDate) });

  const average = await getAverageCycleLength(userId);

  const cycle = await Cycle.create({
    userId,
    startDate,
    endDate: endDate || null,
    notes,
    periodLength: endDate ? diffDays(startDate, endDate) + 1 : null,
    ...buildPredictions(startDate, average),
  });

  await Profile.update({ lastPeriodDate: startDate }, { where: { userId } });

  // Attach any day-logs already entered for this cycle's dates
  await CycleLog.update(
    { cycleId: cycle.id },
    { where: { userId, date: { [Op.gte]: startDate }, cycleId: null } }
  );

  return cycle;
};

// Enhanced health history: free users see the last 3 months, premium sees everything
const getCycles = async (userId, limit = 12, isPremium = false) => {
  const where = { userId };
  if (!isPremium) where.startDate = { [Op.gte]: addDays(today(), -FREE_LIMITS.historyMonths * 30) };
  return Cycle.findAll({ where, order: [["startDate", "DESC"]], limit: Number(limit) });
};

const getCycleById = async (userId, id) => {
  const cycle = await Cycle.findOne({
    where: { id, userId },
    include: [{ association: "logs", separate: true, order: [["date", "ASC"]] }],
  });
  if (!cycle) throw new ApiError(404, "Cycle not found");
  return cycle;
};

const updateCycle = async (userId, id, data) => {
  const cycle = await Cycle.findOne({ where: { id, userId } });
  if (!cycle) throw new ApiError(404, "Cycle not found");

  const startDate = data.startDate || cycle.startDate;
  const endDate = data.endDate !== undefined ? data.endDate : cycle.endDate;
  const average = await getAverageCycleLength(userId);

  return cycle.update({
    ...data,
    startDate,
    endDate,
    periodLength: endDate ? diffDays(startDate, endDate) + 1 : null,
    ...buildPredictions(startDate, average),
  });
};

const deleteCycle = async (userId, id) => {
  const cycle = await Cycle.findOne({ where: { id, userId } });
  if (!cycle) throw new ApiError(404, "Cycle not found");
  await cycle.destroy();
  return true;
};

// What the dashboard shows: where am I in my cycle today?
const getCurrentCycle = async (userId) => {
  const cycle = await Cycle.findOne({ where: { userId }, order: [["startDate", "DESC"]] });
  if (!cycle) return null;

  const now = today();
  const periodLength = cycle.periodLength || (await getAveragePeriodLength(userId));
  const dayOfCycle = diffDays(cycle.startDate, now) + 1;
  const daysUntilNextPeriod = diffDays(now, cycle.predictedNextStart);

  let phase;
  if (dayOfCycle <= periodLength) phase = "menstrual";
  else if (now >= cycle.fertileWindowStart && now <= cycle.fertileWindowEnd) phase = "fertile";
  else if (now < cycle.fertileWindowStart) phase = "follicular";
  else phase = "luteal";

  return {
    cycle,
    dayOfCycle,
    phase,
    daysUntilNextPeriod,
    isLate: daysUntilNextPeriod < 0,
    averageCycleLength: await getAverageCycleLength(userId),
    averagePeriodLength: periodLength,
  };
};

// ---------- Daily logs (flow / symptoms / mood) ----------

const saveLog = async (userId, data) => {
  // Find the cycle this date belongs to (latest cycle that started on/before it)
  const cycle = await Cycle.findOne({
    where: { userId, startDate: { [Op.lte]: data.date } },
    order: [["startDate", "DESC"]],
  });
  const cycleId = cycle ? cycle.id : null;

  const [log, created] = await CycleLog.findOrCreate({
    where: { userId, date: data.date },
    defaults: { ...data, userId, cycleId },
  });
  if (!created) await log.update({ ...data, cycleId });
  return log;
};

const getLogs = async (userId, { from, to } = {}) => {
  const where = { userId };
  if (from || to) {
    where.date = { ...(from && { [Op.gte]: from }), ...(to && { [Op.lte]: to }) };
  }
  return CycleLog.findAll({ where, order: [["date", "DESC"]] });
};

const getLogByDate = async (userId, date) => {
  const log = await CycleLog.findOne({ where: { userId, date } });
  if (!log) throw new ApiError(404, "No entry for that date");
  return log;
};

const deleteLog = async (userId, date) => {
  const log = await CycleLog.findOne({ where: { userId, date } });
  if (!log) throw new ApiError(404, "No entry for that date");
  await log.destroy();
  return true;
};

// ---------- Reports & insights ----------

const getInsights = async (userId, isPremium = false) => {
  // Free users: last 3 months. Premium: everything.
  const cycleWhere = { userId };
  const logCutoff = isPremium ? addDays(today(), -365) : addDays(today(), -FREE_LIMITS.historyMonths * 30);
  if (!isPremium) cycleWhere.startDate = { [Op.gte]: logCutoff };

  const cycles = await Cycle.findAll({ where: cycleWhere, order: [["startDate", "DESC"]], limit: isPremium ? 24 : 6 });
  const lengths = cycles.filter((c) => c.cycleLength).map((c) => c.cycleLength);
  const periods = cycles.filter((c) => c.periodLength).map((c) => c.periodLength);
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

  const logs = await CycleLog.findAll({ where: { userId, date: { [Op.gte]: logCutoff } } });

  const count = (items) =>
    Object.entries(items.reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1 }), {}))
      .sort((a, b) => b[1] - a[1])
      .map(([name, total]) => ({ name, total }));

  return {
    isPremium,
    historyMonths: isPremium ? "all" : FREE_LIMITS.historyMonths,
    totalCycles: cycles.length,
    averageCycleLength: avg(lengths),
    shortestCycle: lengths.length ? Math.min(...lengths) : null,
    longestCycle: lengths.length ? Math.max(...lengths) : null,
    isRegular: lengths.length >= 3 && Math.max(...lengths) - Math.min(...lengths) <= 7,
    averagePeriodLength: avg(periods),
    daysLogged: logs.length,
    topSymptoms: count(logs.flatMap((l) => l.symptoms || [])).slice(0, 5),
    moods: count(logs.map((l) => l.mood).filter(Boolean)),
    flow: count(logs.map((l) => l.flow).filter((f) => f && f !== "none")),
    // Tells the frontend to show the "unlock advanced" card
    advancedAvailable: isPremium,
    upgradeHint: isPremium ? null : "Upgrade for trend analysis, symptom patterns by phase, and full history",
  };
};

module.exports = {
  createCycle,
  getCycles,
  getCycleById,
  updateCycle,
  deleteCycle,
  getCurrentCycle,
  saveLog,
  getLogs,
  getLogByDate,
  deleteLog,
  getInsights,
};