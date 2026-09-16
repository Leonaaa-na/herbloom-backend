const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/payment.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

// Paystack calls this directly — no login token, checked by signature instead
router.post("/webhook", controller.webhook);

router.use(auth);

router.post("/initialize",
  [body("purpose").optional().isIn(["subscription", "appointment", "consultation", "other"])],
  validate, controller.initialize);
router.get("/verify/:reference", controller.verify);
router.get("/", controller.getMyPayments);
router.get("/subscription", controller.getMySubscription);
router.put("/subscription/cancel", controller.cancelSubscription);

module.exports = router;