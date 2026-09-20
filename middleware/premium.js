const { Subscription, Op } = require("../models");

// Is this user on an active, unexpired plan?
const checkPremium = async (userId) => {
  const sub = await Subscription.findOne({
    where: {
      userId,
      status: "active",
      plan: { [Op.ne]: "free" },
      endDate: { [Op.gt]: new Date() },
    },
  });
  return !!sub;
};

// Attaches req.isPremium to every request — never blocks.
// Use this when free users get a LIMITED version of something.
const withPremium = async (req, res, next) => {
  req.isPremium = req.user ? await checkPremium(req.user.id) : false;
  next();
};

// Blocks non-premium users outright.
// Use this on endpoints that are entirely premium.
const requirePremium = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not logged in" });

  req.isPremium = await checkPremium(req.user.id);
  if (!req.isPremium) {
    return res.status(403).json({
      success: false,
      message: "This is a HerBloom Premium feature",
      upgradeRequired: true, // frontend uses this to open PremiumModal
    });
  }
  next();
};

module.exports = { checkPremium, withPremium, requirePremium };