const service = require("../services/professional.service");
const pick = require("../utils/pick");

const PROFILE_FIELDS = [
  "name", "title", "specialty", "hospital", "address", "city", "phone", "email", "bio",
  "yearsOfExperience", "qualifications", "consultationAreas", "languages",
  "consultationFee", "availableDays", "isAvailable", "acceptsChat",
];

const getProfessionals = async (req, res) => res.json({ success: true, data: await service.getProfessionals(req.query) });
const getSpecialties = async (req, res) => res.json({ success: true, data: await service.getSpecialties() });
const getProfessionalById = async (req, res) => res.json({ success: true, data: await service.getProfessionalById(req.params.id) });

const apply = async (req, res) =>
  res.status(201).json({ success: true, message: "Application submitted. Upload your verification document next.", data: await service.apply(req.user, pick(req.body, PROFILE_FIELDS)) });
const getMine = async (req, res) => res.json({ success: true, data: await service.getMine(req.user) });
const updateMine = async (req, res) =>
  res.json({ success: true, message: "Profile updated", data: await service.updateMine(req.user, pick(req.body, PROFILE_FIELDS)) });
const uploadAvatar = async (req, res) =>
  res.json({ success: true, message: "Photo updated", data: await service.uploadAvatar(req.user, req.file) });
const uploadVerification = async (req, res) =>
  res.json({ success: true, message: "Document uploaded. An admin will review it.", data: await service.uploadVerification(req.user, req.file, req.body.licenseNumber) });

// Admin
const adminCreate = async (req, res) =>
  res.status(201).json({ success: true, message: "Professional created", data: await service.adminCreate(pick(req.body, [...PROFILE_FIELDS, "verificationStatus"])) });
const adminList = async (req, res) => res.json({ success: true, data: await service.adminList(req.query) });
const adminVerify = async (req, res) =>
  res.json({ success: true, message: `Professional ${req.body.status}`, data: await service.adminVerify(req.user, req.params.id, req.body.status) });
const adminDelete = async (req, res) => {
  await service.adminDelete(req.params.id);
  res.json({ success: true, message: "Professional deleted" });
};

module.exports = {
  getProfessionals, getSpecialties, getProfessionalById,
  apply, getMine, updateMine, uploadAvatar, uploadVerification,
  adminCreate, adminList, adminVerify, adminDelete,
};