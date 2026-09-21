const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/user.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { uploadAvatar } = require("../middleware/upload");

const router = express.Router();

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required"),
  body("password").matches(passwordRegex).withMessage("Password must be 8+ chars with uppercase, lowercase, and a number"),
  body("acceptTerms").custom((v) => v === true).withMessage("You must accept the terms"),
  body("healthDataConsent").custom((v) => v === true).withMessage("Consent to store health data is required"),
];

const loginRules = [
  body("email").isEmail().withMessage("A valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const changePasswordRules = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").matches(passwordRegex).withMessage("New password must be 8+ chars with uppercase, lowercase, and a number"),
];

const forgotRules = [body("email").isEmail().withMessage("A valid email is required")];

const resetRules = [
  body("email").isEmail().withMessage("A valid email is required"),
  body("code").isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits"),
  body("newPassword").matches(passwordRegex).withMessage("New password must be 8+ chars with uppercase, lowercase, and a number"),
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
router.post("/profile/avatar", auth, uploadAvatar.single("avatar"), controller.uploadAvatar); // form field: "avatar"
router.delete("/profile/avatar", auth, controller.removeAvatar);
router.get("/notification-settings", auth, controller.getNotificationSettings);
router.put("/notification-settings", auth, controller.updateNotificationSettings);

module.exports = router;