const crypto = require("crypto");
const paystack = require("../config/paystack");
const { Payment, Subscription, Appointment } = require("../models");
const ApiError = require("../utils/ApiError");
const notify = require("../utils/notify");
const { PLANS, PREMIUM_FEATURES } = require("../config/plans");

const toPesewas = (ghs) => Math.round(Number(ghs) * 100);
const findPlan = (id) => PLANS.find((p) => p.id === id);

// What PremiumPlans.tsx and PremiumFeatures.tsx fetch
const getPlans = () => ({ plans: PLANS, features: PREMIUM_FEATURES });

const initialize = async (user, { purpose = "subscription", plan, appointmentId, amount }) => {
  let payAmount = amount;
  const metadata = { purpose, userId: user.id };

  if (purpose === "subscription") {
    const selected = findPlan(plan);
    if (!selected) throw new ApiError(400, "Choose a valid plan: monthly or yearly");
    payAmount = selected.price;
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
    const planId = payment.gatewayResponse?.metadata?.plan || "monthly";
    const selected = findPlan(planId) || findPlan("monthly");
    const existing = await Subscription.findOne({ where: { userId: payment.userId, status: "active" } });

    // If they're still subscribed, add the new time onto the end
    const startFrom = existing && new Date(existing.endDate) > new Date() ? new Date(existing.endDate) : new Date();
    const endDate = new Date(startFrom.getTime() + selected.durationDays * 86400000);

    if (existing) await existing.update({ plan: planId, endDate, paymentId: payment.id });
    else await Subscription.create({ userId: payment.userId, paymentId: payment.id, plan: planId, status: "active", startDate: new Date(), endDate });
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

// PremiumStatus.tsx reads this
const getMySubscription = async (userId) => {
  const sub = await Subscription.findOne({ where: { userId, status: "active" }, order: [["createdAt", "DESC"]] });
  const isActive = !!sub && new Date(sub.endDate) > new Date();
  const daysLeft = isActive ? Math.ceil((new Date(sub.endDate) - new Date()) / 86400000) : 0;
  return { subscription: sub, isPremium: isActive, daysLeft, plan: isActive ? sub.plan : "free" };
};

const cancelSubscription = async (userId) => {
  const sub = await Subscription.findOne({ where: { userId, status: "active" } });
  if (!sub) throw new ApiError(404, "No active subscription");
  // Turns off renewal but they keep access until endDate
  return sub.update({ autoRenew: false });
};

module.exports = { getPlans, initialize, verify, handleWebhookEvent, verifySignature, getMyPayments, getMySubscription, cancelSubscription };