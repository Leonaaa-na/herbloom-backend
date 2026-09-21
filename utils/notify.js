const { Notification } = require("../models");

// notify(userId, { title, body, type, data })
// Creates an in-app notification. Never crashes the request if it fails.
const notify = async (userId, { title, body, type = "system", data = null }) => {
  if (!userId) return null;
  try {
    return await Notification.create({ userId, title, body, type, data });
  } catch (err) {
    console.error("Notification failed:", err.message);
    return null;
  }
};

module.exports = notify;