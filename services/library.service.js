const { sequelize, Category, Article, SavedArticle, User, Op } = require("../models");
const ApiError = require("../utils/ApiError");
const cloudinary = require("../config/cloudinary");
const { FREE_LIMITS } = require("../config/plans");

// ---------- Categories ----------

// Each category comes back with how many published articles it has
const getCategories = async () => {
  const categories = await Category.findAll({ order: [["name", "ASC"]] });

  const counts = await Article.findAll({
    where: { isPublished: true },
    attributes: ["categoryId", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    group: ["categoryId"],
    raw: true,
  });
  const countFor = Object.fromEntries(counts.map((c) => [c.categoryId, Number(c.count)]));

  return categories.map((c) => ({ ...c.toJSON(), articleCount: countFor[c.id] || 0 }));
};

const createCategory = (data) => Category.create(data);

const updateCategory = async (id, data) => {
  const category = await Category.findByPk(id);
  if (!category) throw new ApiError(404, "Category not found");
  return category.update(data);
};

const deleteCategory = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw new ApiError(404, "Category not found");
  await category.destroy();
  return true;
};

// ---------- Articles ----------

const ARTICLE_INCLUDE = [
  { association: "category", attributes: ["id", "name", "slug", "icon"] },
  { association: "author", attributes: ["id", "name"] },
];

// ?category=slug&search=text&tag=x&type=&page=1&limit=12
const getArticles = async ({ category, search, tag, type, page = 1, limit = 12 } = {}) => {
  const where = { isPublished: true };
  const include = [...ARTICLE_INCLUDE];

  if (category) include[0] = { ...include[0], where: { slug: category } };
  if (tag) where.tags = { [Op.contains]: [tag] };
  if (type) where.type = type;
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { summary: { [Op.iLike]: `%${search}%` } },
      { content: { [Op.iLike]: `%${search}%` } },
      { sourceName: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const perPage = Math.min(Number(limit) || 12, 100);
  const currentPage = Math.max(Number(page) || 1, 1);

  const { rows, count } = await Article.findAndCountAll({
    where,
    include,
    attributes: { exclude: ["content"] }, // list view doesn't need the full text
    order: [["createdAt", "DESC"]],
    limit: perPage,
    offset: (currentPage - 1) * perPage,
    distinct: true,
  });

  // Premium articles still appear in lists (with a lock badge) — the content is what's gated
  return { articles: rows, total: count, page: currentPage, pages: Math.ceil(count / perPage) };
};

const getArticleBySlug = async (slug, userId = null, isPremium = false) => {
  const article = await Article.findOne({ where: { slug, isPublished: true }, include: ARTICLE_INCLUDE });
  if (!article) throw new ApiError(404, "Article not found");

  await article.increment("views");

  let isSaved = false;
  if (userId) isSaved = !!(await SavedArticle.findOne({ where: { userId, articleId: article.id } }));

  const result = { ...article.toJSON(), views: article.views + 1, isSaved };

  // Premium educational content: show the summary, hide the body
  if (article.isPremium && !isPremium) {
    result.content = null;
    result.locked = true;
    result.upgradeRequired = true;
  }

  return result;
};

const createArticle = async (author, data, file) => {
  if (author.role === "professional") {
    const pro = await author.getProfessionalProfile();
    if (!pro || !pro.isVerified) throw new ApiError(403, "Only verified professionals can publish articles");
  }
  return Article.create({
    ...data,
    authorId: author.id,
    ...(file && { coverImageUrl: file.path, coverImagePublicId: file.filename }),
  });
};

const updateArticle = async (user, id, data, file) => {
  const article = await Article.findByPk(id);
  if (!article) throw new ApiError(404, "Article not found");
  if (user.role !== "admin" && article.authorId !== user.id) throw new ApiError(403, "Not your article");

  if (file) {
    if (article.coverImagePublicId) await cloudinary.uploader.destroy(article.coverImagePublicId);
    data.coverImageUrl = file.path;
    data.coverImagePublicId = file.filename;
  }
  return article.update(data);
};

const deleteArticle = async (user, id) => {
  const article = await Article.findByPk(id);
  if (!article) throw new ApiError(404, "Article not found");
  if (user.role !== "admin" && article.authorId !== user.id) throw new ApiError(403, "Not your article");

  if (article.coverImagePublicId) await cloudinary.uploader.destroy(article.coverImagePublicId);
  await article.destroy();
  return true;
};

// ---------- Saved articles ----------

const toggleSave = async (userId, articleId, isPremium = false) => {
  const article = await Article.findByPk(articleId);
  if (!article) throw new ApiError(404, "Article not found");

  const existing = await SavedArticle.findOne({ where: { userId, articleId } });
  if (existing) {
    await existing.destroy();
    return { saved: false };
  }

  // Unlimited saved health articles is a premium feature
  if (!isPremium) {
    const count = await SavedArticle.count({ where: { userId } });
    if (count >= FREE_LIMITS.savedArticles) {
      const err = new ApiError(403, `Free accounts can save up to ${FREE_LIMITS.savedArticles} articles. Upgrade for unlimited saves.`);
      err.upgradeRequired = true;
      throw err;
    }
  }

  await SavedArticle.create({ userId, articleId });
  return { saved: true };
};

const getSavedArticles = async (userId) => {
  const user = await User.findByPk(userId);
  return user.getSavedArticles({
    include: ARTICLE_INCLUDE,
    attributes: { exclude: ["content"] },
    joinTableAttributes: [],
    order: [["createdAt", "DESC"]],
  });
};

module.exports = {
  getCategories, createCategory, updateCategory, deleteCategory,
  getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle,
  toggleSave, getSavedArticles,
};