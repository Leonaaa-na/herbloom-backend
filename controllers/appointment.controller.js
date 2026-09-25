const service = require("../services/appointment.service");
const pick = require("../utils/pick");

const BOOK_FIELDS = ["professionalId", "scheduledAt", "durationMinutes", "type", "context", "reason", "location"];
const PERSONAL_FIELDS = ["providerName", "scheduledAt", "reason", "notes", "location", "context", "type"];

const book = async (req, res) =>
  res.status(201).json({ success: true, message: "Appointment requested", data: await service.book(req.user, pick(req.body, BOOK_FIELDS)) });

const addPersonal = async (req, res) =>
  res.status(201).json({ success: true, message: "Appointment saved", data: await service.addPersonal(req.user, pick(req.body, PERSONAL_FIELDS)) });

const deletePersonal = async (req, res) => {
  await service.deletePersonal(req.user, req.params.id);
  res.json({ success: true, message: "Appointment removed" });
};

const getMine = async (req, res) => res.json({ success: true, data: await service.getMine(req.user, req.query) });
const getOne = async (req, res) => res.json({ success: true, data: await service.getOne(req.user, req.params.id) });

const reschedule = async (req, res) =>
  res.json({ success: true, message: "Appointment rescheduled", data: await service.reschedule(req.user, req.params.id, pick(req.body, ["scheduledAt", "reason"])) });

const cancel = async (req, res) =>
  res.json({ success: true, message: "Appointment cancelled", data: await service.cancel(req.user, req.params.id, pick(req.body, ["reason"])) });

const confirm = async (req, res) =>
  res.json({ success: true, message: "Appointment confirmed", data: await service.confirm(req.user, req.params.id) });

const decline = async (req, res) =>
  res.json({ success: true, message: "Appointment declined", data: await service.decline(req.user, req.params.id, pick(req.body, ["reason"])) });

const complete = async (req, res) =>
  res.json({ success: true, message: "Appointment completed", data: await service.complete(req.user, req.params.id, pick(req.body, ["notes"])) });

const getForProfessional = async (req, res) => res.json({ success: true, data: await service.getForProfessional(req.user, req.query) });
const getPendingCount = async (req, res) => res.json({ success: true, data: await service.getPendingCount(req.user) });
const getAvailability = async (req, res) => res.json({ success: true, data: await service.getAvailability(req.query) });
const getAllForAdmin = async (req, res) => res.json({ success: true, data: await service.getAllForAdmin(req.query) });

module.exports = {
  book, addPersonal, deletePersonal, getMine, getOne, reschedule, cancel,
  confirm, decline, complete, getForProfessional, getPendingCount, getAvailability, getAllForAdmin,
};