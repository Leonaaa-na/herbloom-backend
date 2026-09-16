const service = require("../services/payment.service");
const pick = require("../utils/pick");

const initialize = async (req, res) => {
  const result = await service.initialize(req.user, pick(req.body, ["purpose", "plan", "appointmentId", "amount"]));
  res.status(201).json({ success: true, message: "Payment initialized", data: result });
};

const verify = async (req, res) => {
  const payment = await service.verify(req.user, req.params.reference);
  res.json({ success: true, message: payment.status === "success" ? "Payment verified" : "Payment not successful", data: payment });
};

// Paystack posts here directly — verified by signature, not a login token
const webhook = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  if (!signature || !service.verifySignature(req.rawBody, signature)) {
    return res.status(401).send("Invalid signature");
  }
  await service.handleWebhookEvent(req.body);
  res.sendStatus(200);
};

const getMyPayments = async (req, res) => res.json({ success: true, data: await service.getMyPayments(req.user.id) });
const getMySubscription = async (req, res) => res.json({ success: true, data: await service.getMySubscription(req.user.id) });
const cancelSubscription = async (req, res) =>
  res.json({ success: true, message: "Auto-renew turned off", data: await service.cancelSubscription(req.user.id) });

module.exports = { initialize, verify, webhook, getMyPayments, getMySubscription, cancelSubscription };