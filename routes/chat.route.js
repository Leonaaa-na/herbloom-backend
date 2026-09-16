const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/chat.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { uploadChatAttachment } = require("../middleware/upload");

const router = express.Router();
router.use(auth);

router.post("/conversations", [body("professionalId").isUUID().withMessage("professionalId is required")], validate, controller.startConversation);
router.get("/conversations", controller.getConversations);
router.get("/conversations/:id/messages", controller.getMessages);
router.post("/conversations/:id/messages", uploadChatAttachment.single("attachment"), controller.sendMessage);
router.put("/conversations/:id/read", controller.markRead);
router.put("/conversations/:id/close", controller.closeConversation);

module.exports = router;