const { ContactMessage } = require("../models");
const { sendEmail, escapeHtml } = require("../config/mailer");

// Save the message, then email it to the HerBloom inbox.
// If the email fails, the message is still saved, so nothing is lost.
const submit = async ({ name, email, subject, message }, userId = null) => {
  const saved = await ContactMessage.create({ name, email, subject, message, userId });

  const inbox = process.env.CONTACT_EMAIL;
  if (inbox) {
    sendEmail({
      to: inbox,
      subject: `HerBloom contact: ${subject || "New message"}`,
      html: `
        <p><b>From:</b> ${escapeHtml(name)} (${escapeHtml(email)})</p>
        <p><b>Subject:</b> ${escapeHtml(subject || "—")}</p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        <p style="color:#888;font-size:12px">Reply directly to ${escapeHtml(email)}. Saved as message ${saved.id}.</p>
      `,
    }).catch((err) => console.error("Contact email failed:", err.message));
  } else {
    console.warn("CONTACT_EMAIL is not set — contact message saved but not emailed");
  }

  return { id: saved.id };
};

module.exports = { submit };