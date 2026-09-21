const service = require("../services/emergency.service");
const pick = require("../utils/pick");

const CONTACT_FIELDS = ["name", "phone", "relationship", "isPrimary"];
const INFO_FIELDS = ["bloodGroup", "allergies", "medicalConditions", "currentMedications", "isPregnant", "pregnancyWeek", "doctorName", "doctorPhone", "preferredHospital", "notes"];
const FACILITY_FIELDS = [
  "name", "type", "category", "description", "address", "city", "region", "phone", "emergencyPhone",
  "website", "latitude", "longitude", "is24Hours", "services", "isActive",
];

// Contacts
const getContacts = async (req, res) => res.json({ success: true, data: await service.getContacts(req.user.id) });
const createContact = async (req, res) =>
  res.status(201).json({ success: true, message: "Contact added", data: await service.createContact(req.user.id, pick(req.body, CONTACT_FIELDS)) });
const updateContact = async (req, res) =>
  res.json({ success: true, message: "Contact updated", data: await service.updateContact(req.user.id, req.params.id, pick(req.body, CONTACT_FIELDS)) });
const deleteContact = async (req, res) => {
  await service.deleteContact(req.user.id, req.params.id);
  res.json({ success: true, message: "Contact deleted" });
};

// Medical info card
const getInfo = async (req, res) => res.json({ success: true, data: await service.getInfo(req.user.id) });
const updateInfo = async (req, res) =>
  res.json({ success: true, message: "Emergency info saved", data: await service.updateInfo(req.user.id, pick(req.body, INFO_FIELDS)) });

// Facilities
const getFacilities = async (req, res) => res.json({ success: true, data: await service.getFacilities(req.query) });
const getHotlines = async (req, res) => res.json({ success: true, data: await service.getHotlines() });
const getNearby = async (req, res) => res.json({ success: true, data: await service.getNearby(req.query) });
const createFacility = async (req, res) =>
  res.status(201).json({ success: true, message: "Facility added", data: await service.createFacility(pick(req.body, FACILITY_FIELDS)) });
const updateFacility = async (req, res) =>
  res.json({ success: true, message: "Facility updated", data: await service.updateFacility(req.params.id, pick(req.body, FACILITY_FIELDS)) });
const deleteFacility = async (req, res) => {
  await service.deleteFacility(req.params.id);
  res.json({ success: true, message: "Facility deleted" });
};

// SOS
const triggerAlert = async (req, res) =>
  res.status(201).json({ success: true, message: "Alert sent", data: await service.triggerAlert(req.user, pick(req.body, ["type", "latitude", "longitude", "address", "message"])) });
const getAlerts = async (req, res) => res.json({ success: true, data: await service.getAlerts(req.user.id) });
const resolveAlert = async (req, res) =>
  res.json({ success: true, message: "Marked as resolved", data: await service.setAlertStatus(req.user.id, req.params.id, "resolved") });
const cancelAlert = async (req, res) =>
  res.json({ success: true, message: "Alert cancelled", data: await service.setAlertStatus(req.user.id, req.params.id, "cancelled") });

module.exports = {
  getContacts, createContact, updateContact, deleteContact,
  getInfo, updateInfo,
  getFacilities, getHotlines, getNearby, createFacility, updateFacility, deleteFacility,
  triggerAlert, getAlerts, resolveAlert, cancelAlert,
};