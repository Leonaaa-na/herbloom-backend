const { Notification, Op } = require("../models");
const ApiError = require("../utils/ApiError");

// ?unread=true&limit=30
const getNotifications = (userId, { unread, limit = 30 } = {}) => {
  const where = { userId };
  if (unread === "true") where.isRead = false;
  return Notification.findAll({ where, order: [["createdAt", "DESC"]], limit: Number(limit) });
};

const getUnreadCount = (userId) => Notification.count({ where: { userId, isRead: false } });

const markRead = async (userId, id) => {
  const n = await Notification.findOne({ where: { id, userId } });
  if (!n) throw new ApiError(404, "Notification not found");
  return n.update({ isRead: true });
};

const markAllRead = async (userId) => {
  await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
  return true;
};

const deleteNotification = async (userId, id) => {
  const n = await Notification.findOne({ where: { id, userId } });
  if (!n) throw new ApiError(404, "Notification not found");
  await n.destroy();
  return true;
};

const clearAll = async (userId) => {
  await Notification.destroy({ where: { userId } });
  return true;
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification, clearAll };