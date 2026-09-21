const express = require("express");
const { body, param } = require("express-validator");
const controller = require("../controllers/pregnancy.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(auth);

const dateRule = (field) => body(field).isISO8601().withMessage(`${field} must be YYYY-MM-DD`);
const optionalDate = (field) =>
  body(field).optional({ values: "falsy" }).isISO8601().withMessage(`${field} must be YYYY-MM-DD`);

// Setup / dashboard
router.post("/", [optionalDate("lastMenstrualPeriod"), optionalDate("dueDate")], validate, controller.setup);
router.get("/current", controller.getCurrent);
router.put("/current", [optionalDate("lastMenstrualPeriod"), optionalDate("dueDate")], validate, controller.update);
router.post("/current/deliver", [body("deliveryType").optional().isIn(["vaginal", "c_section"])], validate, controller.deliver);
router.post("/current/end", controller.end);
router.get("/history", controller.getHistory);

// Baby development (reference data)
router.get("/development", controller.getAllWeeks);
router.get("/development/:week", [param("week").isInt({ min: 1, max: 42 })], validate, controller.getWeek);

// Health logs
router.post("/health-logs",
  [dateRule("date"), body("severity").optional({ values: "falsy" }).isIn(["Mild", "Moderate", "Severe"])],
  validate, controller.createHealthLog);
router.get("/health-logs", controller.getHealthLogs);
router.put("/health-logs/:id", controller.updateHealthLog);
router.delete("/health-logs/:id", controller.deleteHealthLog);

// Kick counter
router.post("/movements/start", controller.startMovementSession);
router.post("/movements/:id/kick", controller.addKick);
router.post("/movements/:id/end", controller.endMovementSession);
router.get("/movements", controller.getMovementSessions);
router.delete("/movements", controller.clearMovementSessions); // clear all history
router.delete("/movements/:id", controller.deleteMovementSession);

// Contraction timer
router.post("/contractions/start", controller.startContractionSession);
router.get("/contractions", controller.getContractionSessions);
router.get("/contractions/:sessionId", controller.getContractionSession);
router.post("/contractions/:sessionId/add", [body("intensity").optional().isIn(["mild", "moderate", "strong"])], validate, controller.addContraction);
router.post("/contractions/:sessionId/end", controller.endContractionSession);
router.post("/contractions/:sessionId/:contractionId/end", controller.endContraction);

// Birth plan
router.get("/birth-plan", controller.getBirthPlan);
router.put("/birth-plan", controller.updateBirthPlan);

// Timeline
router.post("/milestones", [body("title").trim().notEmpty(), dateRule("date")], validate, controller.createMilestone);
router.get("/milestones", controller.getMilestones);
router.put("/milestones/:id", controller.updateMilestone);
router.delete("/milestones/:id", controller.deleteMilestone);

module.exports = router;