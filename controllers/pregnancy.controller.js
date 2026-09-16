const service = require("../services/pregnancy.service");
const pick = require("../utils/pick");

const PREGNANCY_FIELDS = ["lastMenstrualPeriod", "dueDate", "babyNickname", "isFirstPregnancy", "notes"];
const HEALTH_FIELDS = ["date", "weightKg", "bloodPressure", "symptoms", "mood", "notes"];
const BIRTH_PLAN_FIELDS = [
  "hospitalName", "hospitalAddress", "hospitalPhone", "doctorName", "birthPartner", "preferredDeliveryType",
  "painReliefPreferences", "hospitalBagChecklist", "hospitalBagPacked", "transportPlan", "notes",
];
const MILESTONE_FIELDS = ["title", "description", "date", "type"];

const ok = (res, data, message) => res.json({ success: true, ...(message && { message }), data });
const created = (res, data, message) => res.status(201).json({ success: true, ...(message && { message }), data });

// Setup / dashboard
const setup = async (req, res) => created(res, await service.setup(req.user.id, pick(req.body, PREGNANCY_FIELDS)), "Pregnancy set up");
const getCurrent = async (req, res) => ok(res, await service.getCurrent(req.user.id));
const update = async (req, res) => ok(res, await service.update(req.user.id, pick(req.body, PREGNANCY_FIELDS)), "Pregnancy updated");
const deliver = async (req, res) => ok(res, await service.deliver(req.user.id, pick(req.body, ["deliveryDate", "deliveryType"])), "Congratulations! Switched to postpartum");
const end = async (req, res) => ok(res, await service.end(req.user.id), "Pregnancy ended");
const getHistory = async (req, res) => ok(res, await service.getHistory(req.user.id));

// Health logs
const createHealthLog = async (req, res) => created(res, await service.createHealthLog(req.user.id, pick(req.body, HEALTH_FIELDS)), "Log saved");
const getHealthLogs = async (req, res) => ok(res, await service.getHealthLogs(req.user.id));
const updateHealthLog = async (req, res) => ok(res, await service.updateHealthLog(req.user.id, req.params.id, pick(req.body, HEALTH_FIELDS)), "Log updated");
const deleteHealthLog = async (req, res) => { await service.deleteHealthLog(req.user.id, req.params.id); ok(res, null, "Log deleted"); };

// Kick counter
const startMovementSession = async (req, res) => created(res, await service.startMovementSession(req.user.id), "Session started");
const addKick = async (req, res) => ok(res, await service.addKick(req.user.id, req.params.id));
const endMovementSession = async (req, res) => ok(res, await service.endMovementSession(req.user.id, req.params.id, req.body), "Session ended");
const getMovementSessions = async (req, res) => ok(res, await service.getMovementSessions(req.user.id));

// Contraction timer
const startContractionSession = async (req, res) => created(res, await service.startContractionSession(req.user.id), "Timer started");
const addContraction = async (req, res) => created(res, await service.addContraction(req.user.id, req.params.sessionId, pick(req.body, ["startedAt", "endedAt", "intensity"])));
const endContraction = async (req, res) => ok(res, await service.endContraction(req.user.id, req.params.sessionId, req.params.contractionId));
const endContractionSession = async (req, res) => ok(res, await service.endContractionSession(req.user.id, req.params.sessionId, req.body), "Timer stopped");
const getContractionSessions = async (req, res) => ok(res, await service.getContractionSessions(req.user.id));
const getContractionSession = async (req, res) => ok(res, await service.getContractionSession(req.user.id, req.params.sessionId));

// Birth plan
const getBirthPlan = async (req, res) => ok(res, await service.getBirthPlan(req.user.id));
const updateBirthPlan = async (req, res) => ok(res, await service.updateBirthPlan(req.user.id, pick(req.body, BIRTH_PLAN_FIELDS)), "Birth plan saved");

// Timeline
const createMilestone = async (req, res) => created(res, await service.createMilestone(req.user.id, pick(req.body, MILESTONE_FIELDS)), "Milestone added");
const getMilestones = async (req, res) => ok(res, await service.getMilestones(req.user.id));
const updateMilestone = async (req, res) => ok(res, await service.updateMilestone(req.user.id, req.params.id, pick(req.body, MILESTONE_FIELDS)), "Milestone updated");
const deleteMilestone = async (req, res) => { await service.deleteMilestone(req.user.id, req.params.id); ok(res, null, "Milestone deleted"); };

// Baby development
const getAllWeeks = async (req, res) => ok(res, await service.getAllWeeks());
const getWeek = async (req, res) => ok(res, await service.getWeek(Number(req.params.week)));

module.exports = {
  setup, getCurrent, update, deliver, end, getHistory,
  createHealthLog, getHealthLogs, updateHealthLog, deleteHealthLog,
  startMovementSession, addKick, endMovementSession, getMovementSessions,
  startContractionSession, addContraction, endContraction, endContractionSession, getContractionSessions, getContractionSession,
  getBirthPlan, updateBirthPlan,
  createMilestone, getMilestones, updateMilestone, deleteMilestone,
  getAllWeeks, getWeek,
};