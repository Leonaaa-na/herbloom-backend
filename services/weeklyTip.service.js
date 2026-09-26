const { Article, User, Op } = require("../models");
const ApiError = require("../utils/ApiError");
const notify = require("../utils/notify");

const TIP_INCLUDE = [{ association: "category", attributes: ["id", "name", "slug", "icon"] }];

// What the dashboard banner shows. Tips can come from any category —
// menstrual health, pregnancy, nutrition, mental wellbeing and so on.
const getCurrentTip = async () =>
  Article.findOne({
    where: { isWeeklyTip: true, isPublished: true },
    include: TIP_INCLUDE,
    attributes: { exclude: ["content"] },
  });

// Tell everyone who wants health tips
const announce = async (article) => {
  const users = await User.findAll({
    where: { isActive: true },
    attributes: ["id"],
    include: [{ association: "notificationSettings", attributes: ["notificationsEnabled", "healthTipNotifications"] }],
  });

  const recipients = users.filter((u) => {
    const s = u.notificationSettings;
    if (!s) return true; // no settings row yet = defaults, which are on
    return s.notificationsEnabled !== false && s.healthTipNotifications !== false;
  });

  await Promise.all(
    recipients.map((u) =>
      notify(u.id, {
        title: "This week's health tip 🌸",
        body: article.title,
        type: "system",
        data: { articleSlug: article.slug },
      })
    )
  );

  return recipients.length;
};

// Make one article the week's tip (used by the admin editor and the scheduler)
const setWeeklyTip = async (articleId, { announce: shouldAnnounce = true } = {}) => {
  const article = await Article.findByPk(articleId);
  if (!article) throw new ApiError(404, "Article not found");
  if (!article.isPublished) throw new ApiError(400, "Publish the article before featuring it");

  // Only one tip at a time
  await Article.update({ isWeeklyTip: false }, { where: { isWeeklyTip: true } });
  await article.update({ isWeeklyTip: true, lastFeaturedAt: new Date() });

  const notified = shouldAnnounce ? await announce(article) : 0;
  return { article, notified };
};

// Runs every Monday. Picks the freshest article nobody has seen featured yet,
// and falls back to the one featured longest ago so the app never looks stale.
const rotateWeeklyTip = async () => {
  const current = await Article.findOne({ where: { isWeeklyTip: true } });

  // Prefer something never featured, newest first
  let next = await Article.findOne({
    where: {
      isPublished: true,
      isPremium: false, // the weekly tip is for everyone
      lastFeaturedAt: null,
      ...(current && { id: { [Op.ne]: current.id } }),
    },
    order: [["createdAt", "DESC"]],
  });

  // Otherwise the one featured longest ago
  if (!next) {
    next = await Article.findOne({
      where: {
        isPublished: true,
        isPremium: false,
        ...(current && { id: { [Op.ne]: current.id } }),
      },
      order: [["lastFeaturedAt", "ASC"]],
    });
  }

  if (!next) return null; // nothing to feature yet
  const { article, notified } = await setWeeklyTip(next.id);
  console.log(`Weekly tip: "${article.title}" sent to ${notified} user(s)`);
  return article;
};

module.exports = { getCurrentTip, setWeeklyTip, rotateWeeklyTip };