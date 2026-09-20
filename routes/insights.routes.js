const express = require("express");
const controller = require("../controllers/insights.controller");
const auth = require("../middleware/auth");
const { requirePremium } = require("../middleware/premium");

const router = express.Router();

// Every route here is a Premium feature
router.use(auth, requirePremium);

router.get("/", controller.getPersonalized);          // Personalized health insights
router.get("/cycle", controller.getCycleAdvanced);     // Advanced cycle insights & reports
router.get("/wellness", controller.getWellnessAdvanced); // Advanced wellness tracking
router.get("/pregnancy", controller.getPregnancyAdvanced); // Advanced pregnancy insights

module.exports = router;