const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/user.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("acceptTerms").custom((v) => v === true).withMessage("You must accept the terms"),
  body("healthDataConsent").custom((v) => v === true).withMessage("Consent to store health data is required"),
];

const loginRules = [
  body("email").isEmail().withMessage("A valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const changePasswordRules = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

const forgotRules = [body("email").isEmail().withMessage("A valid email is required")];

const resetRules = [
  body("email").isEmail().withMessage("A valid email is required"),
  body("code").isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

// Public
router.post("/register", registerRules, validate, controller.register);
router.post("/login", loginRules, validate, controller.login);
router.post("/forgot-password", forgotRules, validate, controller.forgotPassword);
router.post("/reset-password", resetRules, validate, controller.resetPassword);

// Logged-in only
router.get("/me", auth, controller.getMe);
router.put("/me", auth, controller.updateMe);
router.put("/change-password", auth, changePasswordRules, validate, controller.changePassword);
router.get("/profile", auth, controller.getProfile);
router.put("/profile", auth, controller.updateProfile);
router.get("/notification-settings", auth, controller.getNotificationSettings);
router.put("/notification-settings", auth, controller.updateNotificationSettings);

module.exports = router;