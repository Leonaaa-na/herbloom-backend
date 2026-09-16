require("dotenv").config();
const { sequelize } = require("../config/db");
const { Facility } = require("../models");

const facilities = [
  // National hotlines
  { name: "National Emergency (Police / Fire / Ambulance)", type: "hotline", phone: "112", emergencyPhone: "112", is24Hours: true, services: ["emergency"] },
  { name: "Ghana Police Service", type: "police", phone: "191", emergencyPhone: "191", is24Hours: true, services: ["police"] },
  { name: "Ghana National Fire Service", type: "hotline", phone: "192", emergencyPhone: "192", is24Hours: true, services: ["fire"] },
  { name: "National Ambulance Service", type: "ambulance", phone: "193", emergencyPhone: "193", is24Hours: true, services: ["ambulance"] },
  // Hospitals (approximate coordinates)
  { name: "Korle Bu Teaching Hospital", type: "hospital", city: "Accra", region: "Greater Accra", latitude: 5.5364, longitude: -0.226, is24Hours: true, services: ["emergency", "maternity", "gynaecology"] },
  { name: "Greater Accra Regional Hospital (Ridge)", type: "hospital", city: "Accra", region: "Greater Accra", latitude: 5.5601, longitude: -0.1989, is24Hours: true, services: ["emergency", "maternity"] },
  { name: "37 Military Hospital", type: "hospital", city: "Accra", region: "Greater Accra", latitude: 5.5893, longitude: -0.1827, is24Hours: true, services: ["emergency", "maternity"] },
  { name: "Tema General Hospital", type: "hospital", city: "Tema", region: "Greater Accra", latitude: 5.6512, longitude: -0.0167, is24Hours: true, services: ["emergency", "maternity"] },
  { name: "Komfo Anokye Teaching Hospital", type: "hospital", city: "Kumasi", region: "Ashanti", latitude: 6.6975, longitude: -1.6296, is24Hours: true, services: ["emergency", "maternity"] },
  { name: "Cape Coast Teaching Hospital", type: "hospital", city: "Cape Coast", region: "Central", latitude: 5.1315, longitude: -1.2795, is24Hours: true, services: ["emergency", "maternity"] },
  { name: "Effia Nkwanta Regional Hospital", type: "hospital", city: "Sekondi-Takoradi", region: "Western", latitude: 4.9432, longitude: -1.7255, is24Hours: true, services: ["emergency", "maternity"] },
  { name: "Tamale Teaching Hospital", type: "hospital", city: "Tamale", region: "Northern", latitude: 9.4021, longitude: -0.8393, is24Hours: true, services: ["emergency", "maternity"] },
];

(async () => {
  try {
    await sequelize.authenticate();
    for (const f of facilities) {
      await Facility.findOrCreate({ where: { name: f.name }, defaults: f });
    }
    console.log(`Seeded ${facilities.length} facilities`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await sequelize.close();
  }
})();