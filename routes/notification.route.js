const express = require("express");
const controller = require("../controllers/notification.controller");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

router.get("/", controller.getNotifications);
router.get("/unread-count", controller.getUnreadCount);
router.put("/read-all", controller.markAllRead);
router.put("/:id/read", controller.markRead);
router.delete("/:id", controller.deleteNotification);
router.delete("/", controller.clearAll);

module.exports = router;