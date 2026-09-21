const express = require("express");
const { body, param } = require("express-validator");
const controller = require("../controllers/cycle.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { withPremium } = require("../middleware/premium");

const router = express.Router();

router.use(auth); // everything here needs a logged-in user

const cycleRules = [
  body("startDate").isISO8601().withMessage("startDate must be YYYY-MM-DD"),
  // "falsy" skips null, undefined AND "" (CycleSetup sends an empty string)
  body("endDate").optional({ values: "falsy" }).isISO8601().withMessage("endDate must be YYYY-MM-DD"),
];

const logRules = [
  body("date").isISO8601().withMessage("date must be YYYY-MM-DD"),
  body("flow").optional().isIn(["none", "spotting", "light", "medium", "heavy"]).withMessage("Invalid flow"),
  body("symptoms").optional().isArray().withMessage("symptoms must be a list"),
  body("painLevel").optional({ values: "falsy" }).isInt({ min: 1, max: 10 }).withMessage("painLevel must be 1–10"),
  body("stressLevel").optional({ values: "falsy" }).isIn(["Low", "Moderate", "High"]).withMessage("Invalid stress level"),
];

const dateParam = [param("date").isISO8601().withMessage("date must be YYYY-MM-DD")];

// Fixed paths first, then the ones with :id
router.get("/current", controller.getCurrentCycle);
router.get("/insights", withPremium, controller.getInsights); // free: 3 months, premium: full

router.post("/logs", logRules, validate, controller.saveLog);
router.get("/logs", controller.getLogs);
router.get("/logs/:date", dateParam, validate, controller.getLogByDate);
router.delete("/logs/:date", dateParam, validate, controller.deleteLog);

router.post("/", cycleRules, validate, controller.createCycle);
router.get("/", withPremium, controller.getCycles); // free: last 3 months
router.get("/:id", controller.getCycleById);
router.put("/:id", controller.updateCycle);
router.delete("/:id", controller.deleteCycle);

module.exports = router;