const express = require("express");
const { body, query } = require("express-validator");
const controller = require("../controllers/emergency.controller");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const validate = require("../middleware/validate");

const router = express.Router();

const FACILITY_TYPES = ["hospital", "clinic", "maternity_home", "pharmacy", "ambulance", "hotline", "police", "other"];

// Facilities & hotlines — public (someone in an emergency may not be logged in)
router.get("/facilities", controller.getFacilities);
router.get("/facilities/hotlines", controller.getHotlines);
router.get("/facilities/nearby",
  [query("lat").isFloat({ min: -90, max: 90 }), query("lng").isFloat({ min: -180, max: 180 })],
  validate, controller.getNearby);
router.post("/facilities", auth, role("admin"),
  [body("name").trim().notEmpty(), body("type").isIn(FACILITY_TYPES)],
  validate, controller.createFacility);
router.put("/facilities/:id", auth, role("admin"), controller.updateFacility);
router.delete("/facilities/:id", auth, role("admin"), controller.deleteFacility);

// Everything below needs a logged-in user
router.use(auth);

// Contacts
router.get("/contacts", controller.getContacts);
router.post("/contacts",
  [body("name").trim().notEmpty().withMessage("Name is required"), body("phone").trim().notEmpty().withMessage("Phone is required")],
  validate, controller.createContact);
router.put("/contacts/:id", controller.updateContact);
router.delete("/contacts/:id", controller.deleteContact);

// Medical info card
router.get("/info", controller.getInfo);
router.put("/info", controller.updateInfo);

// SOS
router.post("/alerts",
  [body("type").optional().isIn(["sos", "medical", "safety", "other"]),
   body("latitude").optional().isFloat(), body("longitude").optional().isFloat()],
  validate, controller.triggerAlert);
router.get("/alerts", controller.getAlerts);
router.put("/alerts/:id/resolve", controller.resolveAlert);
router.put("/alerts/:id/cancel", controller.cancelAlert);

module.exports = router;