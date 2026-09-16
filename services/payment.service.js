const crypto = require("crypto");
const paystack = require("../config/paystack");
const { Payment, Subscription, Appointment } = require("../models");
const ApiError = require("../utils/ApiError");
const notify = require("../utils/notify");

// GHS prices — adjust to whatever you're charging
const PLAN_PRICES = { monthly: 20, yearly: 200 };

const toPesewas = (ghs) => Math.round(Number(ghs) * 100);

const initialize = async (user, { purpose = "subscription", plan, appointmentId, amount }) => {
  let payAmount = amount;
  const metadata = { purpose, userId: user.id };

  if (purpose === "subscription") {
    if (!plan || !PLAN_PRICES[plan]) throw new ApiError(400, "Choose a valid plan: monthly or yearly");
    payAmount = PLAN_PRICES[plan];
    metadata.plan = plan;
  }

  if (purpose === "appointment" || purpose === "consultation") {
    if (!appointmentId) throw new ApiError(400, "appointmentId is required");
    const appt = await Appointment.findOne({ where: { id: appointmentId, userId: user.id }, include: ["professional"] });
    if (!appt) throw new ApiError(404, "Appointment not found");
    payAmount = appt.professional.consultationFee || 0;
    if (payAmount <= 0) throw new ApiError(400, "This appointment has no fee to pay");
    metadata.appointmentId = appointmentId;
  }

  if (!payAmount || payAmount <= 0) throw new ApiError(400, "A valid amount is required");

  const reference = `HB-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const payment = await Payment.create({
    userId: user.id,
    appointmentId: purpose === "appointment" || purpose === "consultation" ? appointmentId : null,
    reference,
    amount: payAmount,
    purpose,
    status: "pending",
  });

  const { data } = await paystack.post("/transaction/initialize", {
    email: user.email,
    amount: toPesewas(payAmount),
    reference,
    currency: "GHS",
    callback_url: process.env.PAYSTACK_CALLBACK_URL,
    metadata,
  });

  if (!data.status) throw new ApiError(502, "Could not start payment. Try again.");

  return { payment, authorizationUrl: data.data.authorization_url, accessCode: data.data.access_code };
};

// Shared by both the frontend "verify" call and the webhook
const applySuccess = async (payment) => {
  if (payment.status === "success") return payment; // don't double-apply

  await payment.update({ status: "success", paidAt: new Date() });

  if (payment.purpose === "subscription") {
    const plan = payment.gatewayResponse?.metadata?.plan || "monthly";
    const days = plan === "yearly" ? 365 : 30;
    const existing = await Subscription.findOne({ where: { userId: payment.userId, status: "active" } });
    const startDate = existing && new Date(existing.endDate) > new Date() ? existing.endDate : new Date();
    const endDate = new Date(new Date(startDate).getTime() + days * 86400000);

    if (existing) await existing.update({ plan, endDate, paymentId: payment.id });
    else await Subscription.create({ userId: payment.userId, paymentId: payment.id, plan, status: "active", startDate: new Date(), endDate });
  }

  await notify(payment.userId, { title: "Payment successful", body: `GHS ${payment.amount} — ${payment.purpose}`, type: "payment", data: { paymentId: payment.id } });
  return payment;
};

const applyFailure = async (payment, status = "failed") => {
  if (payment.status === "success") return payment;
  await payment.update({ status });
  await notify(payment.userId, { title: "Payment failed", body: `GHS ${payment.amount} — ${payment.purpose}`, type: "payment", data: { paymentId: payment.id } });
  return payment;
};

// Frontend calls this on the callback page to confirm the result
const verify = async (user, reference) => {
  const payment = await Payment.findOne({ where: { reference, userId: user.id } });
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.status === "success") return payment;

  const { data } = await paystack.get(`/transaction/verify/${reference}`);
  if (!data.status) throw new ApiError(502, "Could not verify payment");

  const tx = data.data;
  await payment.update({ channel: tx.channel, gatewayResponse: tx });

  if (tx.status === "success") return applySuccess(payment);
  return applyFailure(payment, tx.status === "abandoned" ? "abandoned" : "failed");
};

// Paystack calls this directly — the reliable source of truth
const handleWebhookEvent = async (event) => {
  if (!["charge.success", "charge.failed"].includes(event.event)) return;

  const tx = event.data;
  const payment = await Payment.findOne({ where: { reference: tx.reference } });
  if (!payment) return; // not one of ours

  await payment.update({ channel: tx.channel, gatewayResponse: tx });

  if (event.event === "charge.success" && tx.status === "success") await applySuccess(payment);
  else await applyFailure(payment);
};

const verifySignature = (rawBody, signature) => {
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  return hash === signature;
};

const getMyPayments = (userId) => Payment.findAll({ where: { userId }, order: [["createdAt", "DESC"]] });

const getMySubscription = (userId) => Subscription.findOne({ where: { userId, status: "active" }, order: [["createdAt", "DESC"]] });

const cancelSubscription = async (userId) => {
  const sub = await Subscription.findOne({ where: { userId, status: "active" } });
  if (!sub) throw new ApiError(404, "No active subscription");
  return sub.update({ autoRenew: false });
};

module.exports = { initialize, verify, handleWebhookEvent, verifySignature, getMyPayments, getMySubscription, cancelSubscription };