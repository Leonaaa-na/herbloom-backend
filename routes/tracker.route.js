const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/tracker.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(auth);

const CONTEXTS = ["cycle", "pregnancy", "postpartum", "general"];

// Medications
router.post("/medications",
  [body("name").trim().notEmpty().withMessage("Name is required"),
   body("context").optional().isIn(CONTEXTS)],
  validate, controller.createMedication);
router.get("/medications", controller.getMedications);
router.put("/medications/:id", controller.updateMedication);
router.delete("/medications/:id", controller.deleteMedication);
router.post("/medications/:id/logs",
  [body("status").optional().isIn(["taken", "skipped", "missed"])],
  validate, controller.logMedication);
router.get("/medication-logs", controller.getMedicationLogs);

// Nutrition
router.post("/nutrition",
  [body("date").isISO8601().withMessage("date must be YYYY-MM-DD"),
   body("mealType").isIn(["breakfast", "lunch", "dinner", "snack"]).withMessage("Invalid mealType"),
   body("description").trim().notEmpty().withMessage("Description is required")],
  validate, controller.createNutritionLog);
router.get("/nutrition", controller.getNutritionLogs);
router.put("/nutrition/:id", controller.updateNutritionLog);
router.delete("/nutrition/:id", controller.deleteNutritionLog);

// Wellness
router.post("/wellness",
  [body("date").isISO8601().withMessage("date must be YYYY-MM-DD")],
  validate, controller.saveWellnessLog);
router.get("/wellness", controller.getWellnessLogs);
router.delete("/wellness/:id", controller.deleteWellnessLog);

// Notes
router.post("/notes",
  [body("content").trim().notEmpty().withMessage("Content is required")],
  validate, controller.createNote);
router.get("/notes", controller.getNotes);
router.put("/notes/:id", controller.updateNote);
router.delete("/notes/:id", controller.deleteNote);

module.exports = router;