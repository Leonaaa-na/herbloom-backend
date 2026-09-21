require("dotenv").config();
const { sequelize } = require("../config/db");
const { Facility } = require("../models");

// National hotlines — category decides which group they show in
const hotlines = [
  { name: "National Ambulance Service", type: "ambulance", category: "medical", phone: "193", description: "For urgent medical emergencies and ambulance assistance." },
  { name: "National Emergency", type: "hotline", category: "medical", phone: "112", description: "For immediate emergency response and assistance." },
  { name: "Ghana Police Service", type: "police", category: "safety", phone: "191", description: "For emergencies involving personal safety and situations requiring police assistance." },
  { name: "Ghana National Fire Service", type: "hotline", category: "safety", phone: "192", description: "For fire emergencies and rescue assistance." },
].map((h) => ({ ...h, emergencyPhone: h.phone, is24Hours: true, services: ["emergency"] }));

// Your 16 facilities from FindHealthcareFacility.tsx
const facilities = [
  { name: "Korle Bu Teaching Hospital", category: "Teaching Hospital", region: "Greater Accra", city: "Accra", address: "Guggisberg Avenue, Accra", phone: "0302665401", latitude: 5.5339, longitude: -0.2287 },
  { name: "Greater Accra Regional Hospital", category: "Regional Hospital", region: "Greater Accra", city: "Accra", address: "Castle Road, Accra", phone: "+233302428460", latitude: 5.5557, longitude: -0.2011 },
  { name: "37 Military Hospital", category: "Military Hospital", region: "Greater Accra", city: "Accra", address: "Liberation Road, Accra", phone: "+233302777595", latitude: 5.5856, longitude: -0.1807 },
  { name: "University of Ghana Medical Centre", category: "University Hospital", region: "Greater Accra", city: "Accra", address: "Legon, Accra", phone: "+233302550843", latitude: 5.6508, longitude: -0.1869 },
  { name: "The Bank Hospital", category: "General Hospital", region: "Greater Accra", city: "Accra", address: "Shippi Close, near NAFTI, Accra", phone: "+233302739373", latitude: 5.5894, longitude: -0.1708 },
  { name: "Nyaho Medical Centre", category: "Medical Centre", region: "Greater Accra", city: "Accra", address: "35 Kofi Annan Street, Accra", phone: "+233289404041", latitude: 5.6107, longitude: -0.1897 },
  { name: "Accra Medical Centre", category: "Medical Centre", region: "Greater Accra", city: "Accra", address: "6 Angola Lane, Accra", phone: "+233204096099", latitude: 5.5749, longitude: -0.1868 },
  { name: "Family Health Hospital", category: "Hospital", region: "Greater Accra", city: "Accra", address: "Teshie Road, Accra", phone: "+233503326753", latitude: 5.5705, longitude: -0.1158 },
  { name: "Komfo Anokye Teaching Hospital", category: "Teaching Hospital", region: "Ashanti", city: "Kumasi", address: "Bantama, Kumasi", phone: "+233556490029", latitude: 6.6966, longitude: -1.6326 },
  { name: "Tamale Teaching Hospital", category: "Teaching Hospital", region: "Northern", city: "Tamale", address: "Tamale-Salaga Road, Tamale", phone: "+233591854221", latitude: 9.4075, longitude: -0.8428 },
  { name: "Cape Coast Teaching Hospital", category: "Teaching Hospital", region: "Central", city: "Cape Coast", address: "Cape Coast, Central Region", phone: "+233201380902", latitude: 5.1315, longitude: -1.2795 },
  { name: "Ho Teaching Hospital", category: "Teaching Hospital", region: "Volta", city: "Ho", address: "Ho-Denu Road, Ho", phone: "+233208515689", latitude: 6.6008, longitude: 0.4713 },
  { name: "Police Hospital", category: "Hospital", region: "Greater Accra", city: "Accra", address: "Cantonments, Accra", phone: "0302762389", latitude: 5.5759, longitude: -0.1755 },
  { name: "BushRoad Medical Center", category: "Medical Centre", region: "Greater Accra", city: "Accra", address: "Teshie Bushroad, Rasta Junction, Accra", phone: "+233558523995", latitude: 5.5788, longitude: -0.1095 },
  { name: "Arena Community Hospital", category: "Community Hospital", region: "Greater Accra", city: "Accra", address: "Derby Avenue, Accra", phone: "+233244514429", latitude: 5.5608, longitude: -0.2018 },
  { name: "Rayan Medical Centre", category: "Medical Centre", region: "Greater Accra", city: "Accra", address: "92 Dansoman Road, Accra", phone: "+233302963991", latitude: 5.5549, longitude: -0.2485 },
].map((f) => ({
  ...f,
  type: f.category === "Medical Centre" ? "clinic" : "hospital",
  emergencyPhone: f.phone,
  is24Hours: true,
  services: ["emergency"],
}));

// Old demo entries from the first seed that aren't in your list
const RETIRED = ["Greater Accra Regional Hospital (Ridge)", "Tema General Hospital", "Effia Nkwanta Regional Hospital"];

(async () => {
  try {
    await sequelize.authenticate();

    const retired = await Facility.destroy({ where: { name: RETIRED } });

    let created = 0;
    let updated = 0;
    for (const f of [...hotlines, ...facilities]) {
      const existing = await Facility.findOne({ where: { name: f.name } });
      if (existing) {
        await existing.update({ ...f, isActive: true });
        updated++;
      } else {
        await Facility.create(f);
        created++;
      }
    }

    console.log(`Facilities: ${created} created, ${updated} updated, ${retired} old entries removed`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await sequelize.close();
  }
})();