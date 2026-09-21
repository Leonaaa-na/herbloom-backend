const service = require("../services/contact.service");
const pick = require("../utils/pick");

const submit = async (req, res) => {
  // Spam trap: real people never see or fill the hidden "website" field
  if (req.body.website) {
    return res.status(201).json({ success: true, message: "Thanks! We'll get back to you soon." });
  }

  await service.submit(pick(req.body, ["name", "email", "subject", "message"]), req.user ? req.user.id : null);
  res.status(201).json({ success: true, message: "Thanks! We'll get back to you soon." });
};

module.exports = { submit };