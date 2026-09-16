const { Notification } = require("../models");

// notify(userId, { title, body, type, data })
const notify = async (userId, { title, body, type = "system", data = null }) => {
  if (!userId) return null;
  try {
    return await Notification.create({ userId, title, body, type, data });
  } catch (err) {
    console.error("Notification failed:", err.message); // never crash a request over a notification
    return null;
  }
};

module.exports = notify;