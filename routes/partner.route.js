const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/partner.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(auth);

// As the owner
router.post("/invite",
  [body("partnerEmail").isEmail().withMessage("A valid partner email is required")],
  validate, controller.invitePartner);
router.get("/", controller.getMyShares);
router.put("/:id/permissions", controller.updatePermissions);
router.delete("/:id", controller.revokeShare);

// As the partner
router.post("/accept",
  [body("shareCode").trim().notEmpty().withMessage("Share code is required")],
  validate, controller.acceptShare);
router.get("/shared-with-me", controller.getSharedWithMe);
router.get("/shared-with-me/:id", controller.getSharedData);

module.exports = router;