const service = require("../services/notification.service");

const getNotifications = async (req, res) => res.json({ success: true, data: await service.getNotifications(req.user.id, req.query) });
const getUnreadCount = async (req, res) => res.json({ success: true, data: { count: await service.getUnreadCount(req.user.id) } });
const markRead = async (req, res) => res.json({ success: true, data: await service.markRead(req.user.id, req.params.id) });
const markAllRead = async (req, res) => {
  await service.markAllRead(req.user.id);
  res.json({ success: true, message: "All marked as read" });
};
const deleteNotification = async (req, res) => {
  await service.deleteNotification(req.user.id, req.params.id);
  res.json({ success: true, message: "Notification deleted" });
};
const clearAll = async (req, res) => {
  await service.clearAll(req.user.id);
  res.json({ success: true, message: "Notifications cleared" });
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification, clearAll };