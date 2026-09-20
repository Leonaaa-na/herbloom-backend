const { Cycle, CycleLog, WellnessLog, Pregnancy, NutritionLog, MedicationLog, Op } = require("../models");
const { addDays, today, diffDays } = require("../utils/date");

// Average of a list of numbers, rounded
const avg = (arr, decimals = 0) => {
  const vals = arr.filter((v) => v !== null && v !== undefined && !Number.isNaN(v));
  if (!vals.length) return null;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Number(mean.toFixed(decimals));
};

// Count how often each item appears → [{ name, total }] sorted by most common
const countItems = (items) =>
  Object.entries(items.reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1])
    .map(([name, total]) => ({ name, total }));

// ---------- Advanced cycle analysis (premium) ----------

const getAdvancedCycleInsights = async (userId) => {
  const cycles = await Cycle.findAll({ where: { userId }, order: [["startDate", "DESC"]], limit: 24 });
  const lengths = cycles.filter((c) => c.cycleLength).map((c) => c.cycleLength);

  if (lengths.length < 3) {
    return { hasEnoughData: false, message: "Log at least 3 cycles to unlock trend analysis" };
  }

  // Standard deviation tells us how regular the cycles are
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, n) => sum + (n - mean) ** 2, 0) / lengths.length;
  const stdDev = Number(Math.sqrt(variance).toFixed(1));

  // Are cycles getting longer or shorter over time?
  const recent = lengths.slice(0, 3);
  const older = lengths.slice(-3);
  const recentAvg = avg(recent);
  const olderAvg = avg(older);
  let trend = "stable";
  if (recentAvg - olderAvg >= 2) trend = "lengthening";
  if (olderAvg - recentAvg >= 2) trend = "shortening";

  // Which symptoms cluster in which phase of the cycle?
  const logs = await CycleLog.findAll({
    where: { userId, date: { [Op.gte]: addDays(today(), -180) } },
    order: [["date", "ASC"]],
  });

  const phaseSymptoms = { menstrual: [], follicular: [], fertile: [], luteal: [] };
  for (const log of logs) {
    const cycle = cycles.find((c) => log.date >= c.startDate && (!c.predictedNextStart || log.date < c.predictedNextStart));
    if (!cycle) continue;
    const day = diffDays(cycle.startDate, log.date) + 1;
    const periodLength = cycle.periodLength || 5;
    let phase;
    if (day <= periodLength) phase = "menstrual";
    else if (log.date >= cycle.fertileWindowStart && log.date <= cycle.fertileWindowEnd) phase = "fertile";
    else if (log.date < cycle.fertileWindowStart) phase = "follicular";
    else phase = "luteal";
    phaseSymptoms[phase].push(...(log.symptoms || []));
  }

  return {
    hasEnoughData: true,
    cyclesAnalysed: lengths.length,
    averageLength: Math.round(mean),
    variability: stdDev,
    regularity: stdDev <= 2 ? "very regular" : stdDev <= 4 ? "fairly regular" : "irregular",
    trend,
    shortest: Math.min(...lengths),
    longest: Math.max(...lengths),
    predictionConfidence: stdDev <= 2 ? "high" : stdDev <= 4 ? "moderate" : "low",
    symptomsByPhase: Object.fromEntries(
      Object.entries(phaseSymptoms).map(([phase, symptoms]) => [phase, countItems(symptoms).slice(0, 5)])
    ),
  };
};

// ---------- Advanced wellness analysis (premium) ----------

const getAdvancedWellnessInsights = async (userId, days = 90) => {
  const logs = await WellnessLog.findAll({
    where: { userId, date: { [Op.gte]: addDays(today(), -days) } },
    order: [["date", "ASC"]],
  });

  if (logs.length < 7) {
    return { hasEnoughData: false, message: "Log at least 7 days of wellness to unlock trends" };
  }

  const half = Math.floor(logs.length / 2);
  const firstHalf = logs.slice(0, half);
  const secondHalf = logs.slice(half);

  const direction = (recent, older, higherIsBetter = true) => {
    if (recent === null || older === null) return "no data";
    const change = recent - older;
    if (Math.abs(change) < 0.3) return "stable";
    const improving = higherIsBetter ? change > 0 : change < 0;
    return improving ? "improving" : "declining";
  };

  const metric = (key, higherIsBetter = true, decimals = 1) => ({
    average: avg(logs.map((l) => l[key]), decimals),
    recentAverage: avg(secondHalf.map((l) => l[key]), decimals),
    earlierAverage: avg(firstHalf.map((l) => l[key]), decimals),
    trend: direction(avg(secondHalf.map((l) => l[key]), 1), avg(firstHalf.map((l) => l[key]), 1), higherIsBetter),
  });

  // Does sleep affect energy? Rough correlation.
  const paired = logs.filter((l) => l.sleepHours !== null && l.energyLevel !== null);
  let sleepEnergyLink = null;
  if (paired.length >= 10) {
    const goodSleep = paired.filter((l) => l.sleepHours >= 7);
    const poorSleep = paired.filter((l) => l.sleepHours < 7);
    if (goodSleep.length >= 3 && poorSleep.length >= 3) {
      const diff = avg(goodSleep.map((l) => l.energyLevel), 1) - avg(poorSleep.map((l) => l.energyLevel), 1);
      sleepEnergyLink = {
        energyWithGoodSleep: avg(goodSleep.map((l) => l.energyLevel), 1),
        energyWithPoorSleep: avg(poorSleep.map((l) => l.energyLevel), 1),
        meaningful: Math.abs(diff) >= 0.5,
      };
    }
  }

  return {
    hasEnoughData: true,
    daysLogged: logs.length,
    periodCovered: days,
    energy: metric("energyLevel", true),
    stress: metric("stressLevel", false),
    sleep: metric("sleepHours", true),
    water: metric("waterMl", true, 0),
    exercise: metric("exerciseMinutes", true, 0),
    topMoods: countItems(logs.map((l) => l.mood).filter(Boolean)).slice(0, 5),
    topExercises: countItems(logs.map((l) => l.exerciseType).filter(Boolean)).slice(0, 5),
    sleepEnergyLink,
  };
};

// ---------- Advanced pregnancy analysis (premium) ----------

const getAdvancedPregnancyInsights = async (userId) => {
  const pregnancy = await Pregnancy.findOne({ where: { userId, status: "active" } });
  if (!pregnancy) return { hasEnoughData: false, message: "No active pregnancy" };

  const logs = await pregnancy.getHealthLogs({ order: [["date", "ASC"]] });
  if (!logs.length) {
    return { hasEnoughData: false, message: "Log your health to unlock pregnancy trends" };
  }

  const weights = logs.filter((l) => l.weightKg).map((l) => ({ date: l.date, week: l.week, weight: l.weightKg }));
  const weightGain = weights.length >= 2 ? Number((weights[weights.length - 1].weight - weights[0].weight).toFixed(1)) : null;

  // Blood pressure readings, most recent first
  const readings = logs
    .filter((l) => l.bloodPressure && /^\d{2,3}\/\d{2,3}$/.test(l.bloodPressure))
    .map((l) => {
      const [systolic, diastolic] = l.bloodPressure.split("/").map(Number);
      return { date: l.date, week: l.week, systolic, diastolic };
    });

  const latestBP = readings.length ? readings[readings.length - 1] : null;

  return {
    hasEnoughData: true,
    currentWeek: pregnancy.currentWeek,
    trimester: pregnancy.trimester,
    logsRecorded: logs.length,
    weightTracking: {
      startWeight: weights.length ? weights[0].weight : null,
      currentWeight: weights.length ? weights[weights.length - 1].weight : null,
      totalGainKg: weightGain,
      history: weights.slice(-12),
    },
    bloodPressure: {
      latest: latestBP,
      averageSystolic: avg(readings.map((r) => r.systolic)),
      averageDiastolic: avg(readings.map((r) => r.diastolic)),
      history: readings.slice(-12),
    },
    commonSymptoms: countItems(logs.flatMap((l) => l.symptoms || [])).slice(0, 8),
    moodPattern: countItems(logs.map((l) => l.mood).filter(Boolean)).slice(0, 5),
    note: "These are your own logged figures, not a medical assessment. Discuss anything concerning with your healthcare provider.",
  };
};

// ---------- Personalized health insights (premium) ----------
// Pulls everything together into short plain-language observations

const getPersonalizedInsights = async (userId) => {
  const observations = [];
  const since = addDays(today(), -60);

  const [cycleData, wellness, nutrition, medLogs] = await Promise.all([
    getAdvancedCycleInsights(userId),
    getAdvancedWellnessInsights(userId, 60),
    NutritionLog.findAll({ where: { userId, date: { [Op.gte]: since } } }),
    MedicationLog.findAll({ where: { userId, scheduledFor: { [Op.gte]: new Date(since) } } }),
  ]);

  // Cycle regularity
  if (cycleData.hasEnoughData) {
    observations.push({
      area: "cycle",
      title: `Your cycles are ${cycleData.regularity}`,
      detail: `Average ${cycleData.averageLength} days, varying by about ${cycleData.variability} days. Prediction confidence: ${cycleData.predictionConfidence}.`,
    });
    if (cycleData.trend !== "stable") {
      observations.push({
        area: "cycle",
        title: `Your cycles are ${cycleData.trend}`,
        detail: "Recent cycles differ from your earlier ones. Worth mentioning at your next check-up if it continues.",
      });
    }
  }

  // Wellness trends
  if (wellness.hasEnoughData) {
    if (wellness.sleep.trend === "declining") {
      observations.push({ area: "sleep", title: "Your sleep has dropped recently", detail: `Now averaging ${wellness.sleep.recentAverage} hours, down from ${wellness.sleep.earlierAverage}.` });
    }
    if (wellness.stress.trend === "declining") {
      observations.push({ area: "wellbeing", title: "Your stress levels have risen", detail: `Recent average ${wellness.stress.recentAverage} out of 5, up from ${wellness.stress.earlierAverage}.` });
    }
    if (wellness.energy.trend === "improving") {
      observations.push({ area: "wellbeing", title: "Your energy is trending up", detail: `Recent average ${wellness.energy.recentAverage} out of 5.` });
    }
    if (wellness.sleepEnergyLink?.meaningful) {
      observations.push({
        area: "sleep",
        title: "Sleep seems to affect your energy",
        detail: `On 7+ hours you average ${wellness.sleepEnergyLink.energyWithGoodSleep} energy, versus ${wellness.sleepEnergyLink.energyWithPoorSleep} on less.`,
      });
    }
  }

  // Medication consistency
  if (medLogs.length >= 5) {
    const taken = medLogs.filter((l) => l.status === "taken").length;
    const rate = Math.round((taken / medLogs.length) * 100);
    observations.push({
      area: "medication",
      title: `You've taken ${rate}% of your logged doses`,
      detail: rate >= 80 ? "Good consistency over the last 60 days." : "Setting reminders may help you stay on track.",
    });
  }

  // Nutrition logging habit
  if (nutrition.length) {
    const days = new Set(nutrition.map((n) => n.date)).size;
    observations.push({ area: "nutrition", title: `You logged meals on ${days} days`, detail: `${nutrition.length} meals recorded in the last 60 days.` });
  }

  return {
    generatedAt: new Date(),
    observations,
    isEmpty: observations.length === 0,
    message: observations.length === 0 ? "Keep logging for a couple of weeks and your personalized insights will appear here." : null,
    disclaimer: "These observations come from your own logged data. They are not medical advice.",
  };
};

module.exports = {
  getAdvancedCycleInsights,
  getAdvancedWellnessInsights,
  getAdvancedPregnancyInsights,
  getPersonalizedInsights,
};