const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/reminder.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(auth);

const rules = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("type").optional().isIn(["period", "pregnancy", "medication", "appointment", "wellness", "custom"]),
  body("date").isISO8601().withMessage("date must be YYYY-MM-DD"),
  body("time").matches(/^\d{2}:\d{2}$/).withMessage("time must be HH:MM, e.g. 08:30"),
  body("repeat").optional().isIn(["none", "daily", "weekly", "monthly"]),
];

router.post("/sync", controller.sync);
router.post("/", rules, validate, controller.createReminder);
router.get("/", controller.getReminders);
router.get("/:id", controller.getReminder);
router.put("/:id", controller.updateReminder);
router.put("/:id/complete", controller.toggleComplete);
router.delete("/:id", controller.deleteReminder);

module.exports = router;