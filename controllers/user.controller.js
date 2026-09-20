const userService = require("../services/user.service");
const pick = require("../utils/pick");

const PROFILE_FIELDS = [
  "username", "dateOfBirth", "bio", "city", "country", "heightCm", "weightKg", "bloodGroup",
  "averageCycleLength", "averagePeriodLength", "lastPeriodDate", "lifeStage",
  "theme", "language", "dateFormat", "weekStartsOn", "units", "discreetMode",
];

const SETTINGS_FIELDS = [
  "notificationsEnabled", "periodNotifications", "pregnancyNotifications", "medicationNotifications",
  "appointmentNotifications", "wellnessNotifications", "notificationSound", "vibration", "emailNotifications",
];

const register = async (req, res) => {
  const { user, token } = await userService.register(req.body);
  res.status(201).json({ success: true, message: "Account created", data: { user, token } });
};

const login = async (req, res) => {
  const { user, token } = await userService.login(req.body);
  res.json({ success: true, message: "Logged in", data: { user, token } });
};

const getMe = async (req, res) => {
  const user = await userService.getMe(req.user.id);
  res.json({ success: true, data: user });
};

const updateMe = async (req, res) => {
  const user = await userService.updateMe(req.user, pick(req.body, ["name", "phone"]));
  res.json({ success: true, message: "Account updated", data: user });
};

const changePassword = async (req, res) => {
  await userService.changePassword(req.user, req.body);
  res.json({ success: true, message: "Password changed" });
};

const getProfile = async (req, res) => {
  const profile = await userService.getProfile(req.user.id);
  res.json({ success: true, data: profile });
};

const updateProfile = async (req, res) => {
  const profile = await userService.updateProfile(req.user.id, pick(req.body, PROFILE_FIELDS));
  res.json({ success: true, message: "Profile updated", data: profile });
};

const getNotificationSettings = async (req, res) => {
  const settings = await userService.getNotificationSettings(req.user.id);
  res.json({ success: true, data: settings });
};

const updateNotificationSettings = async (req, res) => {
  const settings = await userService.updateNotificationSettings(req.user.id, pick(req.body, SETTINGS_FIELDS));
  res.json({ success: true, message: "Notification settings updated", data: settings });
};

const forgotPassword = async (req, res) => {
  await userService.forgotPassword(req.body.email);
  res.json({ success: true, message: "If that email exists, a reset code has been sent" });
};

const resetPassword = async (req, res) => {
  await userService.resetPassword(req.body);
  res.json({ success: true, message: "Password reset. You can now log in" });
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  getProfile,
  updateProfile,
  getNotificationSettings,
  updateNotificationSettings,
  forgotPassword,
  resetPassword,
};