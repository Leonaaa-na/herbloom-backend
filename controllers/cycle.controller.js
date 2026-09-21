const cycleService = require("../services/cycle.service");
const pick = require("../utils/pick");

const CYCLE_FIELDS = ["startDate", "endDate", "notes"];
const LOG_FIELDS = ["date", "flow", "symptoms", "mood", "painLevel", "painLocation", "stressLevel", "temperature", "notes"];

const createCycle = async (req, res) => {
  const cycle = await cycleService.createCycle(req.user.id, pick(req.body, CYCLE_FIELDS));
  res.status(201).json({ success: true, message: "Period logged", data: cycle });
};

const getCycles = async (req, res) => {
  const cycles = await cycleService.getCycles(req.user.id, req.query.limit, req.isPremium);
  res.json({ success: true, data: cycles });
};

const getCurrentCycle = async (req, res) => {
  const current = await cycleService.getCurrentCycle(req.user.id);
  res.json({ success: true, data: current });
};

const getInsights = async (req, res) => {
  const insights = await cycleService.getInsights(req.user.id, req.isPremium);
  res.json({ success: true, data: insights });
};

const getCycleById = async (req, res) => {
  const cycle = await cycleService.getCycleById(req.user.id, req.params.id);
  res.json({ success: true, data: cycle });
};

const updateCycle = async (req, res) => {
  const cycle = await cycleService.updateCycle(req.user.id, req.params.id, pick(req.body, CYCLE_FIELDS));
  res.json({ success: true, message: "Cycle updated", data: cycle });
};

const deleteCycle = async (req, res) => {
  await cycleService.deleteCycle(req.user.id, req.params.id);
  res.json({ success: true, message: "Cycle deleted" });
};

const saveLog = async (req, res) => {
  const log = await cycleService.saveLog(req.user.id, pick(req.body, LOG_FIELDS));
  res.status(201).json({ success: true, message: "Day saved", data: log });
};

const getLogs = async (req, res) => {
  const logs = await cycleService.getLogs(req.user.id, req.query);
  res.json({ success: true, data: logs });
};

const getLogByDate = async (req, res) => {
  const log = await cycleService.getLogByDate(req.user.id, req.params.date);
  res.json({ success: true, data: log });
};

const deleteLog = async (req, res) => {
  await cycleService.deleteLog(req.user.id, req.params.date);
  res.json({ success: true, message: "Entry deleted" });
};

module.exports = {
  createCycle,
  getCycles,
  getCurrentCycle,
  getInsights,
  getCycleById,
  updateCycle,
  deleteCycle,
  saveLog,
  getLogs,
  getLogByDate,
  deleteLog,
};