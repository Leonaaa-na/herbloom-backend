const service = require("../services/appointment.service");
const pick = require("../utils/pick");

const BOOK_FIELDS = ["professionalId", "scheduledAt", "durationMinutes", "type", "context", "reason", "location"];

const book = async (req, res) =>
  res.status(201).json({ success: true, message: "Appointment requested", data: await service.book(req.user, pick(req.body, BOOK_FIELDS)) });

const getMine = async (req, res) => res.json({ success: true, data: await service.getMine(req.user, req.query) });
const getOne = async (req, res) => res.json({ success: true, data: await service.getOne(req.user, req.params.id) });

const reschedule = async (req, res) =>
  res.json({ success: true, message: "Appointment rescheduled", data: await service.reschedule(req.user, req.params.id, pick(req.body, ["scheduledAt", "reason"])) });

const cancel = async (req, res) =>
  res.json({ success: true, message: "Appointment cancelled", data: await service.cancel(req.user, req.params.id, pick(req.body, ["reason"])) });

const confirm = async (req, res) =>
  res.json({ success: true, message: "Appointment confirmed", data: await service.confirm(req.user, req.params.id) });

const complete = async (req, res) =>
  res.json({ success: true, message: "Appointment completed", data: await service.complete(req.user, req.params.id, pick(req.body, ["notes"])) });

const getForProfessional = async (req, res) => res.json({ success: true, data: await service.getForProfessional(req.user, req.query) });
const getAvailability = async (req, res) => res.json({ success: true, data: await service.getAvailability(req.query) });

module.exports = { book, getMine, getOne, reschedule, cancel, confirm, complete, getForProfessional, getAvailability };