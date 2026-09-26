const express = require("express");
const service = require("../services/weeklyTip.service");

const router = express.Router();

// Public — the dashboard banner reads this
router.get("/", async (req, res) => {
  res.json({ success: true, data: await service.getCurrentTip() });
});

module.exports = router;