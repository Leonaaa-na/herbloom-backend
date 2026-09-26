const service = require("../services/admin.service");

const getStats = async (req, res) => res.json({ success: true, data: await service.getStats() });

const getUsers = async (req, res) => res.json({ success: true, data: await service.getUsers(req.query) });

const setUserStatus = async (req, res) =>
  res.json({
    success: true,
    message: req.body.isActive ? "Account reactivated" : "Account deactivated",
    data: await service.setUserStatus(req.user.id, req.params.id, req.body.isActive === true),
  });

const getProfessionals = async (req, res) => res.json({ success: true, data: await service.getProfessionals(req.query) });

const verifyProfessional = async (req, res) =>
  res.json({
    success: true,
    message: `Professional ${req.body.status}`,
    data: await service.verifyProfessional(req.user, req.params.id, req.body.status),
  });

const getMessages = async (req, res) => res.json({ success: true, data: await service.getMessages(req.query) });

const setMessageStatus = async (req, res) =>
  res.json({ success: true, message: "Message updated", data: await service.setMessageStatus(req.params.id, req.body.status) });

const getPayments = async (req, res) => res.json({ success: true, data: await service.getPayments(req.query) });

// Make an article this week's health tip
const featureArticle = async (req, res) => {
  const { article, notified } = await service.featureArticle(req.params.id);
  res.json({
    success: true,
    message: `"${article.title}" is now this week's tip — ${notified} user(s) notified`,
    data: { notified },
  });
};

module.exports = {
  getStats, getUsers, setUserStatus,
  getProfessionals, verifyProfessional,
  getMessages, setMessageStatus, getPayments,
  featureArticle,
};