const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/professional.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const validate = require("../middleware/validate");
const { uploadAvatar, uploadVerificationDoc } = require("../middleware/upload");

const router = express.Router();

// Public directory
router.get("/", controller.getProfessionals);
router.get("/specialties", controller.getSpecialties);

// Professional's own account (must be above /:id)
router.post("/apply", auth, [body("specialty").trim().notEmpty().withMessage("Specialty is required")], validate, controller.apply);
router.get("/me", auth, role("professional", "admin"), controller.getMine);
router.put("/me", auth, role("professional", "admin"), controller.updateMine);
router.post("/me/avatar", auth, role("professional", "admin"), uploadAvatar.single("avatar"), controller.uploadAvatar);
router.post("/me/verification", auth, role("professional", "admin"), uploadVerificationDoc.single("document"), controller.uploadVerification);

// Admin
router.get("/admin/all", auth, role("admin"), controller.adminList);
router.post("/admin", auth, role("admin"), [body("name").trim().notEmpty(), body("specialty").trim().notEmpty()], validate, controller.adminCreate);
router.put("/admin/:id/verify", auth, role("admin"), [body("status").isIn(["verified", "rejected", "pending"])], validate, controller.adminVerify);
router.delete("/admin/:id", auth, role("admin"), controller.adminDelete);

// Public profile
router.get("/:id", controller.getProfessionalById);

module.exports = router;