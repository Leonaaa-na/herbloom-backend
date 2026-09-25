const express = require("express");
const { body } = require("express-validator");
const service = require("../services/push.service");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

// The frontend needs this before it can ask the browser for permission
router.get("/public-key", (req, res) => res.json({ success: true, data: service.getPublicKey() }));

router.post(
  "/subscribe",
  auth,
  [body("endpoint").notEmpty(), body("keys.p256dh").notEmpty(), body("keys.auth").notEmpty()],
  validate,
  async (req, res) => {
    const data = await service.subscribe(req.user.id, {
      endpoint: req.body.endpoint,
      keys: req.body.keys,
      userAgent: req.headers["user-agent"],
    });
    res.status(201).json({ success: true, message: "Notifications enabled on this device", data });
  }
);

router.post("/unsubscribe", auth, async (req, res) => {
  const data = await service.unsubscribe(req.user.id, req.body.endpoint);
  res.json({ success: true, message: "Notifications turned off on this device", data });
});

// Lets the user check it works — great for the demo
router.post("/test", auth, async (req, res) => {
  const sent = await service.sendToUser(req.user.id, {
    title: "HerBloom 🌸",
    body: "Push notifications are working on this device.",
    url: "/notifications",
    tag: "test",
  });
  res.json({
    success: true,
    message: sent ? `Test sent to ${sent} device(s)` : "No devices are subscribed yet on this account",
    data: { sent },
  });
});

module.exports = router;