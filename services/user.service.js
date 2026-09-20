const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sequelize, User, Profile, NotificationSetting, Op } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendEmail, escapeHtml } = require("../config/mailer");

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const hashCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");

const register = async ({ name, email, password, phone, acceptTerms, healthDataConsent }) => {
  const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const now = new Date();

  // User + Profile + NotificationSetting are created together or not at all
  const user = await sequelize.transaction(async (t) => {
    const created = await User.create(
      {
        name,
        email,
        password,
        phone,
        termsAcceptedAt: acceptTerms ? now : null,
        healthDataConsentAt: healthDataConsent ? now : null,
      },
      { transaction: t }
    );
    await Profile.create({ userId: created.id }, { transaction: t });
    await NotificationSetting.create({ userId: created.id }, { transaction: t });
    return created;
  });

  return { user, token: signToken(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (!user.isActive) throw new ApiError(403, "Your account has been deactivated");

  user.lastLoginAt = new Date();
  await user.save();

  return { user, token: signToken(user) };
};

const getMe = async (userId) => {
  return User.findByPk(userId, { include: ["profile", "notificationSettings"] });
};

const updateMe = async (user, data) => {
  return user.update(data);
};

const changePassword = async (user, { currentPassword, newPassword }) => {
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, "Current password is incorrect");
  }
  user.password = newPassword; // hashed by the beforeUpdate hook
  await user.save();
  return true;
};

const getProfile = async (userId) => {
  const [profile] = await Profile.findOrCreate({ where: { userId } });
  return profile;
};

const updateProfile = async (userId, data) => {
  const profile = await getProfile(userId);
  return profile.update(data);
};

const getNotificationSettings = async (userId) => {
  const [settings] = await NotificationSetting.findOrCreate({ where: { userId } });
  return settings;
};

const updateNotificationSettings = async (userId, data) => {
  const settings = await getNotificationSettings(userId);
  return settings.update(data);
};

// ---------- Password reset ----------

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  // Always "succeed" so nobody can use this to check which emails exist
  if (!user) return true;

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  user.resetPasswordToken = hashCode(code); // store the hash, not the code
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await user.save();

  if (process.env.NODE_ENV !== "production") {
    console.log(`Password reset code for ${user.email}: ${code}`); // handy while testing
  }

  await sendEmail({
    to: user.email,
    subject: "Your HerBloom password reset code",
    html: `
      <p>Hi ${escapeHtml(user.name)},</p>
      <p>Your password reset code is:</p>
      <h2 style="letter-spacing:4px">${code}</h2>
      <p>It expires in 15 minutes. If you didn't ask for this, you can ignore this email.</p>
    `,
  });

  return true;
};

const resetPassword = async ({ email, code, newPassword }) => {
  const user = await User.findOne({
    where: {
      email: email.toLowerCase().trim(),
      resetPasswordToken: hashCode(code),
      resetPasswordExpires: { [Op.gt]: new Date() }, // not expired
    },
  });
  if (!user) throw new ApiError(400, "Invalid or expired code");

  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return true;
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