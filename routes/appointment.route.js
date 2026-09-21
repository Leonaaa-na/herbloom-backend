const express = require("express");
const { body, query } = require("express-validator");
const controller = require("../controllers/appointment.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(auth);

const CONTEXTS = ["general", "pregnancy", "cycle", "postpartum"];

const bookRules = [
  body("professionalId").isUUID().withMessage("professionalId is required"),
  body("scheduledAt").isISO8601().withMessage("scheduledAt must be a date-time, e.g. 2026-09-20T10:00:00"),
  body("type").optional().isIn(["in_person", "virtual", "phone"]),
  body("context").optional().isIn(CONTEXTS),
];

const personalRules = [
  body("providerName").trim().notEmpty().withMessage("Doctor or clinic name is required"),
  body("scheduledAt").isISO8601().withMessage("scheduledAt must be a date-time, e.g. 2026-09-20T10:00:00"),
  body("context").optional().isIn(CONTEXTS),
];

// Fixed paths first
router.get("/availability",
  [query("professionalId").isUUID(), query("date").isISO8601().withMessage("date must be YYYY-MM-DD")],
  validate, controller.getAvailability);
router.get("/professional", role("professional", "admin"), controller.getForProfessional);
router.post("/personal", personalRules, validate, controller.addPersonal);

// Patient
router.post("/", bookRules, validate, controller.book);
router.get("/", controller.getMine);
router.get("/:id", controller.getOne);
router.put("/:id/reschedule", [body("scheduledAt").isISO8601().withMessage("scheduledAt is required")], validate, controller.reschedule);
router.put("/:id/cancel", controller.cancel);
router.delete("/:id", controller.deletePersonal); // personal appointments only

// Completing: professional for booked ones, the patient for personal ones (checked in the service)
router.put("/:id/complete", controller.complete);

// Professional / admin
router.put("/:id/confirm", role("professional", "admin"), controller.confirm);

module.exports = router;