const { Op } = require("sequelize");
const { Notification } = require("../models");

// notify(userId, { title, body, type, data })
const notify = async (userId, { title, body, type = "system", data = null }) => {
  if (!userId) return null;
  try {
    return await Notification.create({ userId, title, body, type, data });
  } catch (err) {
    console.error("Notification failed:", err.message);
    return null;
  }
};

// Batch notify — N+1 resistant: inserts all notifications in one query
const notifyBatch = async (notifications) => {
  if (!notifications || !notifications.length) return;
  try {
    await Notification.bulkCreate(
      notifications.map((n) => ({
        userId: n.userId,
        title: n.title,
        body: n.body,
        type: n.type || "system",
        data: n.data || null,
      }))
    );
  } catch (err) {
    console.error("Batch notification failed:", err.message);
  }
};

module.exports = { notify, notifyBatch };