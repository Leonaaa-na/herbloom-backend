const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/community.controller");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const validate = require("../middleware/validate");
const { uploadPostImage } = require("../middleware/upload");
const { TOPICS } = require("../services/community.service");

const router = express.Router();

router.get("/topics", controller.getTopics);

// My own stats (must be above /users/:id)
router.get("/me/stats", auth, controller.getMyStats);

// Posts — reading works logged out (optionalAuth adds isSupported/isMine when a token is present)
router.get("/posts", optionalAuth, controller.getPosts);
router.get("/posts/:id", optionalAuth, controller.getPost);
router.post("/posts", auth, uploadPostImage.single("image"),
  [body("content").trim().notEmpty().withMessage("Content is required"), body("topic").optional().isIn(TOPICS)],
  validate, controller.createPost);
router.put("/posts/:id", auth, controller.updatePost);
router.delete("/posts/:id", auth, controller.deletePost);

// Support
router.post("/posts/:id/support", auth, controller.toggleSupport);

// Comments & replies (send parentId to reply)
router.get("/posts/:id/comments", controller.getComments);
router.post("/posts/:id/comments", auth, [body("content").trim().notEmpty().withMessage("Content is required")], validate, controller.addComment);
router.delete("/comments/:id", auth, controller.deleteComment);

// Public user profile
router.get("/users/:id", controller.getUserProfile);

module.exports = router;