const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/library.controller");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const role = require("../middleware/role");
const validate = require("../middleware/validate");
const { withPremium } = require("../middleware/premium");
const { uploadArticleImage } = require("../middleware/upload");

const router = express.Router();

// Categories — anyone can read, admin manages
router.get("/categories", controller.getCategories);
router.post("/categories", auth, role("admin"), [body("name").trim().notEmpty()], validate, controller.createCategory);
router.put("/categories/:id", auth, role("admin"), controller.updateCategory);
router.delete("/categories/:id", auth, role("admin"), controller.deleteCategory);

// Saved — logged-in user (must be above /articles/:slug)
router.get("/saved", auth, controller.getSavedArticles);
router.post("/articles/:id/save", auth, withPremium, controller.toggleSave); // free cap: 5

// Articles — anyone can read, admin + verified professionals write
router.get("/articles", controller.getArticles);
router.get("/articles/:slug", optionalAuth, withPremium, controller.getArticleBySlug); // premium content locked
router.post(
  "/articles",
  auth, role("admin", "professional"),
  uploadArticleImage.single("coverImage"),
  [body("title").trim().notEmpty().withMessage("Title is required"), body("content").trim().notEmpty().withMessage("Content is required")],
  validate,
  controller.createArticle
);
router.put("/articles/:id", auth, role("admin", "professional"), uploadArticleImage.single("coverImage"), controller.updateArticle);
router.delete("/articles/:id", auth, role("admin", "professional"), controller.deleteArticle);

module.exports = router;