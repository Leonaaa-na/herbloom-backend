const { Medication, MedicationLog, NutritionLog, WellnessLog, Note, Op } = require("../models");
const ApiError = require("../utils/ApiError");

// Reusable "find one of mine or 404"
const findOwned = async (Model, userId, id, label) => {
  const row = await Model.findOne({ where: { id, userId } });
  if (!row) throw new ApiError(404, `${label} not found`);
  return row;
};

// Turns ?from=&to=&context= into a Sequelize where
const buildWhere = (userId, { from, to, context } = {}, dateField = "date") => {
  const where = { userId };
  if (context) where.context = context;
  if (from || to) {
    where[dateField] = { ...(from && { [Op.gte]: from }), ...(to && { [Op.lte]: to }) };
  }
  return where;
};

// ---------- Medications ----------

const createMedication = (userId, data) => Medication.create({ ...data, userId });

const getMedications = (userId, { context, active } = {}) => {
  const where = { userId };
  if (context) where.context = context;
  if (active !== undefined) where.isActive = active === "true";
  return Medication.findAll({ where, order: [["createdAt", "DESC"]] });
};

const updateMedication = async (userId, id, data) => {
  const med = await findOwned(Medication, userId, id, "Medication");
  return med.update(data);
};

const deleteMedication = async (userId, id) => {
  const med = await findOwned(Medication, userId, id, "Medication");
  await med.destroy();
  return true;
};

// "I took it" / "I skipped it"
const logMedication = async (userId, medicationId, { status = "taken", scheduledFor, notes }) => {
  await findOwned(Medication, userId, medicationId, "Medication");
  return MedicationLog.create({
    medicationId,
    userId,
    status,
    scheduledFor: scheduledFor || new Date(),
    takenAt: status === "taken" ? new Date() : null,
    notes,
  });
};

const getMedicationLogs = (userId, { from, to, medicationId } = {}) => {
  const where = buildWhere(userId, { from, to }, "scheduledFor");
  if (medicationId) where.medicationId = medicationId;
  return MedicationLog.findAll({ where, include: ["medication"], order: [["scheduledFor", "DESC"]] });
};

// ---------- Nutrition ----------

const createNutritionLog = (userId, data) => NutritionLog.create({ ...data, userId });

const getNutritionLogs = (userId, query) =>
  NutritionLog.findAll({ where: buildWhere(userId, query), order: [["date", "DESC"], ["createdAt", "DESC"]] });

const updateNutritionLog = async (userId, id, data) => {
  const row = await findOwned(NutritionLog, userId, id, "Meal");
  return row.update(data);
};

const deleteNutritionLog = async (userId, id) => {
  const row = await findOwned(NutritionLog, userId, id, "Meal");
  await row.destroy();
  return true;
};

// ---------- Wellness (one check-in per day → create or update) ----------

const saveWellnessLog = async (userId, data) => {
  const [row, created] = await WellnessLog.findOrCreate({
    where: { userId, date: data.date },
    defaults: { ...data, userId },
  });
  if (!created) await row.update(data);
  return row;
};

const getWellnessLogs = (userId, query) =>
  WellnessLog.findAll({ where: buildWhere(userId, query), order: [["date", "DESC"]] });

const deleteWellnessLog = async (userId, id) => {
  const row = await findOwned(WellnessLog, userId, id, "Wellness entry");
  await row.destroy();
  return true;
};

// ---------- Notes ----------

const createNote = (userId, data) => Note.create({ ...data, userId });

const getNotes = (userId, { context } = {}) => {
  const where = { userId };
  if (context) where.context = context;
  return Note.findAll({ where, order: [["isPinned", "DESC"], ["createdAt", "DESC"]] });
};

const updateNote = async (userId, id, data) => {
  const note = await findOwned(Note, userId, id, "Note");
  return note.update(data);
};

const deleteNote = async (userId, id) => {
  const note = await findOwned(Note, userId, id, "Note");
  await note.destroy();
  return true;
};

module.exports = {
  createMedication,
  getMedications,
  updateMedication,
  deleteMedication,
  logMedication,
  getMedicationLogs,
  createNutritionLog,
  getNutritionLogs,
  updateNutritionLog,
  deleteNutritionLog,
  saveWellnessLog,
  getWellnessLogs,
  deleteWellnessLog,
  createNote,
  getNotes,
  updateNote,
  deleteNote,
};