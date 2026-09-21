const service = require("../services/tracker.service");
const pick = require("../utils/pick");

const MED_FIELDS = ["name", "dosage", "frequency", "times", "context", "startDate", "endDate", "notes", "isActive"];
const NUTRITION_FIELDS = ["date", "mealType", "description", "calories", "protein", "carbs", "fat", "context", "notes"];
const WELLNESS_FIELDS = [
  "date", "mood", "energyLevel", "stressLevel", "sleepHours",
  "waterGlasses", "waterMl", "activities", "exerciseMinutes", "exerciseType",
  "foodGroups", "nutritionNotes", "gentleMovement", "restDone",
  "context", "notes",
];
const NOTE_FIELDS = ["title", "content", "context", "date", "isPinned"];

// Medications
const createMedication = async (req, res) => {
  const med = await service.createMedication(req.user.id, pick(req.body, MED_FIELDS));
  res.status(201).json({ success: true, message: "Medication added", data: med });
};
const getMedications = async (req, res) => {
  res.json({ success: true, data: await service.getMedications(req.user.id, req.query) });
};
const updateMedication = async (req, res) => {
  const med = await service.updateMedication(req.user.id, req.params.id, pick(req.body, MED_FIELDS));
  res.json({ success: true, message: "Medication updated", data: med });
};
const deleteMedication = async (req, res) => {
  await service.deleteMedication(req.user.id, req.params.id);
  res.json({ success: true, message: "Medication deleted" });
};
const logMedication = async (req, res) => {
  const log = await service.logMedication(req.user.id, req.params.id, pick(req.body, ["status", "scheduledFor", "notes"]));
  res.status(201).json({ success: true, message: "Dose logged", data: log });
};
const getMedicationLogs = async (req, res) => {
  res.json({ success: true, data: await service.getMedicationLogs(req.user.id, req.query) });
};

// Nutrition
const createNutritionLog = async (req, res) => {
  const row = await service.createNutritionLog(req.user.id, pick(req.body, NUTRITION_FIELDS));
  res.status(201).json({ success: true, message: "Meal logged", data: row });
};
const getNutritionLogs = async (req, res) => {
  res.json({ success: true, data: await service.getNutritionLogs(req.user.id, req.query) });
};
const updateNutritionLog = async (req, res) => {
  const row = await service.updateNutritionLog(req.user.id, req.params.id, pick(req.body, NUTRITION_FIELDS));
  res.json({ success: true, message: "Meal updated", data: row });
};
const deleteNutritionLog = async (req, res) => {
  await service.deleteNutritionLog(req.user.id, req.params.id);
  res.json({ success: true, message: "Meal deleted" });
};

// Wellness
const saveWellnessLog = async (req, res) => {
  const row = await service.saveWellnessLog(req.user.id, pick(req.body, WELLNESS_FIELDS));
  res.status(201).json({ success: true, message: "Wellness saved", data: row });
};
const getWellnessLogs = async (req, res) => {
  res.json({ success: true, data: await service.getWellnessLogs(req.user.id, req.query) });
};
const deleteWellnessLog = async (req, res) => {
  await service.deleteWellnessLog(req.user.id, req.params.id);
  res.json({ success: true, message: "Entry deleted" });
};

// Notes
const createNote = async (req, res) => {
  const note = await service.createNote(req.user.id, pick(req.body, NOTE_FIELDS));
  res.status(201).json({ success: true, message: "Note saved", data: note });
};
const getNotes = async (req, res) => {
  res.json({ success: true, data: await service.getNotes(req.user.id, req.query) });
};
const updateNote = async (req, res) => {
  const note = await service.updateNote(req.user.id, req.params.id, pick(req.body, NOTE_FIELDS));
  res.json({ success: true, message: "Note updated", data: note });
};
const deleteNote = async (req, res) => {
  await service.deleteNote(req.user.id, req.params.id);
  res.json({ success: true, message: "Note deleted" });
};

module.exports = {
  createMedication, getMedications, updateMedication, deleteMedication, logMedication, getMedicationLogs,
  createNutritionLog, getNutritionLogs, updateNutritionLog, deleteNutritionLog,
  saveWellnessLog, getWellnessLogs, deleteWellnessLog,
  createNote, getNotes, updateNote, deleteNote,
};