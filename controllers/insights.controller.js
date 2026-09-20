const service = require("../services/insights.service");

const getPersonalized = async (req, res) =>
  res.json({ success: true, data: await service.getPersonalizedInsights(req.user.id) });

const getCycleAdvanced = async (req, res) =>
  res.json({ success: true, data: await service.getAdvancedCycleInsights(req.user.id) });

const getWellnessAdvanced = async (req, res) =>
  res.json({ success: true, data: await service.getAdvancedWellnessInsights(req.user.id, Number(req.query.days) || 90) });

const getPregnancyAdvanced = async (req, res) =>
  res.json({ success: true, data: await service.getAdvancedPregnancyInsights(req.user.id) });

module.exports = { getPersonalized, getCycleAdvanced, getWellnessAdvanced, getPregnancyAdvanced };