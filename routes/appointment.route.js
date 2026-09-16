const express = require("express");
const { body, query } = require("express-validator");
const controller = require("../controllers/appointment.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(auth);

const bookRules = [
  body("professionalId").isUUID().withMessage("professionalId is required"),
  body("scheduledAt").isISO8601().withMessage("scheduledAt must be a date-time, e.g. 2026-09-20T10:00:00"),
  body("type").optional().isIn(["in_person", "virtual", "phone"]),
  body("context").optional().isIn(["general", "pregnancy", "cycle", "postpartum"]),
];

// Fixed paths first
router.get("/availability",
  [query("professionalId").isUUID(), query("date").isISO8601().withMessage("date must be YYYY-MM-DD")],
  validate, controller.getAvailability);
router.get("/professional", role("professional", "admin"), controller.getForProfessional);

// Patient
router.post("/", bookRules, validate, controller.book);
router.get("/", controller.getMine);
router.get("/:id", controller.getOne);
router.put("/:id/reschedule", [body("scheduledAt").isISO8601().withMessage("scheduledAt is required")], validate, controller.reschedule);
router.put("/:id/cancel", controller.cancel);

// Professional / admin
router.put("/:id/confirm", role("professional", "admin"), controller.confirm);
router.put("/:id/complete", role("professional", "admin"), controller.complete);

module.exports = router;