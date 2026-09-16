const service = require("../services/library.service");
const pick = require("../utils/pick");

const CATEGORY_FIELDS = ["name", "description", "icon"];
const ARTICLE_FIELDS = ["categoryId", "title", "summary", "content", "tags", "isPremium", "isPublished"];

// Multipart forms send everything as text, so turn "a,b" or '["a","b"]' into a real array
const parseTags = (body) => {
  if (typeof body.tags === "string") {
    try { body.tags = JSON.parse(body.tags); } catch { body.tags = body.tags.split(",").map((t) => t.trim()).filter(Boolean); }
  }
  return body;
};

// Categories
const getCategories = async (req, res) => res.json({ success: true, data: await service.getCategories() });
const createCategory = async (req, res) =>
  res.status(201).json({ success: true, message: "Category created", data: await service.createCategory(pick(req.body, CATEGORY_FIELDS)) });
const updateCategory = async (req, res) =>
  res.json({ success: true, message: "Category updated", data: await service.updateCategory(req.params.id, pick(req.body, CATEGORY_FIELDS)) });
const deleteCategory = async (req, res) => {
  await service.deleteCategory(req.params.id);
  res.json({ success: true, message: "Category deleted" });
};

// Articles
const getArticles = async (req, res) => res.json({ success: true, data: await service.getArticles(req.query) });
const getArticleBySlug = async (req, res) =>
  res.json({ success: true, data: await service.getArticleBySlug(req.params.slug, req.user ? req.user.id : null) });
const createArticle = async (req, res) =>
  res.status(201).json({ success: true, message: "Article published", data: await service.createArticle(req.user, pick(parseTags(req.body), ARTICLE_FIELDS), req.file) });
const updateArticle = async (req, res) =>
  res.json({ success: true, message: "Article updated", data: await service.updateArticle(req.user, req.params.id, pick(parseTags(req.body), ARTICLE_FIELDS), req.file) });
const deleteArticle = async (req, res) => {
  await service.deleteArticle(req.user, req.params.id);
  res.json({ success: true, message: "Article deleted" });
};

// Saved
const toggleSave = async (req, res) => {
  const result = await service.toggleSave(req.user.id, req.params.id);
  res.json({ success: true, message: result.saved ? "Article saved" : "Removed from saved", data: result });
};
const getSavedArticles = async (req, res) => res.json({ success: true, data: await service.getSavedArticles(req.user.id) });

module.exports = {
  getCategories, createCategory, updateCategory, deleteCategory,
  getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle,
  toggleSave, getSavedArticles,
};