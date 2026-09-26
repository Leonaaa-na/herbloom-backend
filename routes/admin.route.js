const express = require("express");
const controller = require("../controllers/admin.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

// Everything here is admin-only
router.use(auth, role("admin"));

router.get("/stats", controller.getStats);

router.get("/users", controller.getUsers);
router.put("/users/:id/status", controller.setUserStatus);

router.get("/professionals", controller.getProfessionals);
router.put("/professionals/:id/verify", controller.verifyProfessional);

router.get("/messages", controller.getMessages);
router.put("/messages/:id", controller.setMessageStatus);

router.get("/payments", controller.getPayments);

// Weekly health tip
router.put("/articles/:id/feature", controller.featureArticle);

module.exports = router;