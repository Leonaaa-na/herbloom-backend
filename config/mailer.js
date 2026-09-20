const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Escape HTML special characters to prevent injection
const escapeHtml = (str) =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// sendEmail({ to, subject, html })
const sendEmail = async ({ to, subject, html }) => {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "HerBloom <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Email failed:", error);
    throw new Error("Could not send email");
  }

  return data; // { id: "..." }
};

module.exports = { sendEmail, escapeHtml };