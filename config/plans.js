// Prices in GHS
const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: 20,
    currency: "GHS",
    durationDays: 30,
    description: "Full access, billed monthly",
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 200,
    currency: "GHS",
    durationDays: 365,
    description: "Full access, billed yearly",
    badge: "Best value",
    savingsNote: "Save GHS 40 compared to monthly",
  },
];

const PREMIUM_FEATURES = [
  "Advanced cycle insights & reports",
  "Personalized health insights",
  "Advanced pregnancy insights",
  "Unlimited saved health articles",
  "Priority healthcare consultation access",
  "Advanced wellness tracking",
  "Advanced reminders & notifications",
  "Premium educational content",
  "Enhanced health history",
  "Premium community features",
];

// What free users are capped at
const FREE_LIMITS = {
  savedArticles: 5,
  activeReminders: 3,
  historyMonths: 3,
};

module.exports = { PLANS, PREMIUM_FEATURES, FREE_LIMITS };