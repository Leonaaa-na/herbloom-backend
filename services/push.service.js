const { PushSubscription } = require("../models");
const { webpush, ready, publicKey } = require("../config/push");

// The frontend asks for this before it can subscribe
const getPublicKey = () => ({ publicKey: publicKey || null, enabled: ready });

// Save (or refresh) this device
const subscribe = async (userId, { endpoint, keys, userAgent }) => {
  const [row, created] = await PushSubscription.findOrCreate({
    where: { endpoint },
    defaults: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent, lastUsedAt: new Date() },
  });

  // Same device, different account (or re-allowed after being removed)
  if (!created) {
    await row.update({ userId, p256dh: keys.p256dh, auth: keys.auth, userAgent, lastUsedAt: new Date() });
  }
  return { subscribed: true };
};

const unsubscribe = async (userId, endpoint) => {
  await PushSubscription.destroy({ where: { userId, endpoint } });
  return { subscribed: false };
};

// Send to every device this person has allowed.
// Never throws — a failed notification must not break the thing that triggered it.
const sendToUser = async (userId, { title, body, url = "/notifications", tag, data = {} }) => {
  if (!ready) return 0;

  const subs = await PushSubscription.findAll({ where: { userId } });
  if (!subs.length) return 0;

  const payload = JSON.stringify({ title, body, url, tag, data });
  let sent = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
        await sub.update({ lastUsedAt: new Date() });
      } catch (err) {
        // 404 or 410 means the browser threw this subscription away — clean it up
        if (err.statusCode === 404 || err.statusCode === 410) {
          await sub.destroy();
        } else {
          console.error("Push failed:", err.statusCode || err.message);
        }
      }
    })
  );

  return sent;
};

module.exports = { getPublicKey, subscribe, unsubscribe, sendToUser };