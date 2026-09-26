const { fn, col } = require("sequelize");
const {
  User, Profile, Subscription, Payment, Appointment, Post, Professional,
  ContactMessage, Conversation, Reminder, Op,
} = require("../models");
const ApiError = require("../utils/ApiError");
const weeklyTip = require("./weeklyTip.service");

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

// ---------- Dashboard ----------

const getStats = async () => {
  const today = startOfToday();
  const weekAgo = daysAgo(7);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    totalUsers, newThisWeek, activeToday, deactivated,
    premiumUsers, expiringSoon,
    revenueTotal, revenueThisMonth, successfulPayments, pendingPayments,
    totalProfessionals, pendingVerifications,
    totalAppointments, upcomingAppointments,
    totalPosts, totalConversations, activeReminders,
    newMessages,
  ] = await Promise.all([
    User.count(),
    User.count({ where: { createdAt: { [Op.gte]: weekAgo } } }),
    User.count({ where: { lastLoginAt: { [Op.gte]: today } } }),
    User.count({ where: { isActive: false } }),
    Subscription.count({ where: { status: "active", endDate: { [Op.gt]: new Date() } } }),
    Subscription.count({ where: { status: "active", endDate: { [Op.between]: [new Date(), daysAgo(-7)] } } }),
    Payment.sum("amount", { where: { status: "success" } }),
    Payment.sum("amount", { where: { status: "success", paidAt: { [Op.gte]: monthStart } } }),
    Payment.count({ where: { status: "success" } }),
    Payment.count({ where: { status: "pending" } }),
    Professional.count(),
    Professional.count({ where: { verificationStatus: "pending" } }),
    Appointment.count(),
    Appointment.count({ where: { status: ["pending", "confirmed", "rescheduled"], scheduledAt: { [Op.gte]: new Date() } } }),
    Post.count(),
    Conversation.count(),
    Reminder.count({ where: { completed: false } }),
    ContactMessage.count({ where: { status: "new" } }),
  ]);

  // Sign-ups per day for the last 30 days
  const rows = await User.findAll({
    attributes: [[fn("to_char", col("createdAt"), "YYYY-MM-DD"), "day"], [fn("COUNT", col("id")), "count"]],
    where: { createdAt: { [Op.gte]: daysAgo(30) } },
    group: [fn("to_char", col("createdAt"), "YYYY-MM-DD")],
    raw: true,
  });
  const perDay = Object.fromEntries(rows.map((r) => [r.day, Number(r.count)]));

  // Fill in the days with no sign-ups so the chart has no gaps
  const signupsChart = [];
  for (let i = 29; i >= 0; i--) {
    const day = daysAgo(i).toISOString().slice(0, 10);
    signupsChart.push({ day, count: perDay[day] || 0 });
  }

  return {
    users: { total: totalUsers, newThisWeek, activeToday, deactivated },
    premium: {
      active: premiumUsers,
      expiringSoon,
      conversionRate: totalUsers ? Math.round((premiumUsers / totalUsers) * 1000) / 10 : 0, // %
    },
    revenue: {
      total: Number(revenueTotal || 0),
      thisMonth: Number(revenueThisMonth || 0),
      successfulPayments,
      pendingPayments,
    },
    professionals: { total: totalProfessionals, pendingVerifications },
    activity: {
      appointments: totalAppointments,
      upcomingAppointments,
      posts: totalPosts,
      consultations: totalConversations,
      activeReminders,
    },
    messages: { new: newMessages },
    signupsChart,
  };
};

// ---------- Users ----------

const getUsers = async ({ search, role, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (role) where.role = role;
  if (search) {
    where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }];
  }

  const perPage = Math.min(Number(limit) || 20, 100);
  const currentPage = Math.max(Number(page) || 1, 1);

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: ["id", "name", "email", "role", "isActive", "lastLoginAt", "createdAt"],
    include: [{ model: Profile, as: "profile", attributes: ["username", "city", "lifeStage"] }],
    order: [["createdAt", "DESC"]],
    limit: perPage,
    offset: (currentPage - 1) * perPage,
  });

  // Mark who currently has premium
  const subs = await Subscription.findAll({
    where: { status: "active", endDate: { [Op.gt]: new Date() }, userId: rows.map((u) => u.id) },
    attributes: ["userId", "plan", "endDate"],
    raw: true,
  });
  const premiumFor = Object.fromEntries(subs.map((s) => [s.userId, s]));

  return {
    users: rows.map((u) => ({ ...u.toJSON(), premium: premiumFor[u.id] || null })),
    total: count,
    page: currentPage,
    pages: Math.ceil(count / perPage),
  };
};

// Turn an account off (or back on). Admins can't lock themselves out.
const setUserStatus = async (adminId, userId, isActive) => {
  if (adminId === userId) throw new ApiError(400, "You can't deactivate your own account");
  const user = await User.findByPk(userId);
  if (!user) throw new ApiError(404, "User not found");
  await user.update({ isActive });
  return { id: user.id, isActive: user.isActive };
};

// ---------- Professional verifications ----------

const getProfessionals = ({ status } = {}) =>
  Professional.findAll({
    where: status ? { verificationStatus: status } : {},
    include: [{ model: User, as: "user", attributes: ["id", "name", "email", "createdAt"] }],
    order: [["createdAt", "DESC"]],
  });

const verifyProfessional = async (admin, id, status) => {
  if (!["verified", "rejected", "pending"].includes(status)) throw new ApiError(400, "Invalid status");
  const pro = await Professional.findByPk(id);
  if (!pro) throw new ApiError(404, "Professional not found");
  return pro.update({
    verificationStatus: status,
    verifiedAt: status === "verified" ? new Date() : null,
    verifiedById: status === "verified" ? admin.id : null,
  });
};

// ---------- Contact messages ----------

const getMessages = ({ status } = {}) =>
  ContactMessage.findAll({
    where: status ? { status } : {},
    order: [["createdAt", "DESC"]],
    limit: 200,
  });

const setMessageStatus = async (id, status) => {
  if (!["new", "read", "replied"].includes(status)) throw new ApiError(400, "Invalid status");
  const msg = await ContactMessage.findByPk(id);
  if (!msg) throw new ApiError(404, "Message not found");
  return msg.update({ status });
};

// ---------- Payments ----------

const getPayments = ({ status } = {}) =>
  Payment.findAll({
    where: status ? { status } : {},
    attributes: { exclude: ["gatewayResponse"] },
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
    order: [["createdAt", "DESC"]],
    limit: 200,
  });

// ---------- Weekly health tip ----------

// Make an article this week's tip and notify everyone who wants health tips
const featureArticle = (id) => weeklyTip.setWeeklyTip(id);

module.exports = {
  getStats, getUsers, setUserStatus,
  getProfessionals, verifyProfessional,
  getMessages, setMessageStatus, getPayments,
  featureArticle,
};