const service = require("../services/reminder.service");
const pick = require("../utils/pick");

const FIELDS = ["title", "type", "date", "time", "notes", "repeat", "completed"];

const createReminder = async (req, res) =>
  res.status(201).json({ success: true, message: "Reminder created", data: await service.createReminder(req.user.id, pick(req.body, FIELDS), req.isPremium) });
const getReminders = async (req, res) => res.json({ success: true, data: await service.getReminders(req.user.id, req.query) });
const getReminder = async (req, res) => res.json({ success: true, data: await service.getReminder(req.user.id, req.params.id) });
const updateReminder = async (req, res) =>
  res.json({ success: true, message: "Reminder updated", data: await service.updateReminder(req.user.id, req.params.id, pick(req.body, FIELDS)) });
const deleteReminder = async (req, res) => {
  await service.deleteReminder(req.user.id, req.params.id);
  res.json({ success: true, message: "Reminder deleted" });
};
const toggleComplete = async (req, res) => res.json({ success: true, data: await service.toggleComplete(req.user.id, req.params.id) });

// Refresh my automatic reminders right now (frontend can call this after logging a period / booking)
const sync = async (req, res) => {
  await service.syncAutomaticReminders(req.user.id);
  res.json({ success: true, message: "Automatic reminders updated", data: await service.getReminders(req.user.id, { upcoming: "true" }) });
};

module.exports = { createReminder, getReminders, getReminder, updateReminder, deleteReminder, toggleComplete, sync };