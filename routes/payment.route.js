const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/payment.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Paystack calls this directly — no login token, checked by signature instead
const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many webhook attempts, please try again later" },
});

router.post("/webhook", webhookLimiter, controller.webhook);

// Public — PremiumPlans.tsx / PremiumFeatures.tsx can show prices before login
router.get("/plans", controller.getPlans);

router.use(auth);

router.post("/initialize",
  [body("purpose").optional().isIn(["subscription", "appointment", "consultation", "other"])],
  validate, controller.initialize);
router.get("/verify/:reference", controller.verify);
router.get("/", controller.getMyPayments);
router.get("/subscription", controller.getMySubscription);
router.put("/subscription/cancel", controller.cancelSubscription);

module.exports = router;