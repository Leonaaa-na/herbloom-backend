const { Notification } = require("../models");
const pushService = require("../services/push.service");

// Where tapping the notification should take the person
const linkFor = (type, data = {}) => {
  if (data.appointmentId) return `/appointments/${data.appointmentId}`;
  if (data.conversationId) return "/notifications";
  if (data.postId) return `/community/comments?post=${data.postId}`;
  if (type === "payment") return "/premium/status";
  return "/notifications";
};

// notify(userId, { title, body, type, data })
// Creates an in-app notification AND pushes it to the person's devices.
// Never crashes the request if either part fails.
const notify = async (userId, { title, body, type = "system", data = null }) => {
  if (!userId) return null;

  let record = null;
  try {
    record = await Notification.create({ userId, title, body, type, data });
  } catch (err) {
    console.error("Notification failed:", err.message);
  }

  // Fire and forget — the caller shouldn't wait on the browser push service
  pushService
    .sendToUser(userId, {
      title,
      body: body || "",
      url: linkFor(type, data || {}),
      tag: type, // a newer notification of the same type replaces the older one
      data: data || {},
    })
    .catch((err) => console.error("Push notify failed:", err.message));

  return record;
};

module.exports = notify;