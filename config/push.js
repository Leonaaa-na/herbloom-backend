const webpush = require("web-push");

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const contact = process.env.VAPID_CONTACT_EMAIL || "mailto:support@herbloom.com";

let ready = false;

if (publicKey && privateKey) {
  webpush.setVapidDetails(contact, publicKey, privateKey);
  ready = true;
} else {
  console.warn("Push notifications are off — VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set");
}

module.exports = { webpush, ready, publicKey };