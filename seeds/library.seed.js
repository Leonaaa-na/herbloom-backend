require("dotenv").config();
const { sequelize } = require("../config/db");
const { Category } = require("../models");
const slugify = require("../utils/slugify");

const categories = [
  { name: "Menstrual Health", icon: "🩸", description: "Learn about periods, menstrual health and cycle wellbeing." },
  { name: "Pregnancy", icon: "🤰🏾", description: "Reliable information about pregnancy and maternal health." },
  { name: "Fertility", icon: "🌱", description: "Explore fertility and reproductive health information." },
  { name: "Nutrition", icon: "🥗", description: "Learn about healthy eating and nutritional wellbeing." },
  { name: "Mental Wellbeing", icon: "🧠", description: "Explore mental and emotional wellbeing." },
  { name: "Sleep", icon: "🌙", description: "Learn about healthy sleep and rest." },
  { name: "Wellness & Exercise", icon: "🏃🏾‍♀️", description: "Explore physical activity and healthy lifestyle information." },
  { name: "Postpartum", icon: "👶🏾", description: "Learn about recovery, care and wellbeing after childbirth." },
];

(async () => {
  try {
    await sequelize.authenticate();

    for (const c of categories) {
      const [row, created] = await Category.findOrCreate({
        where: { name: c.name },
        defaults: { ...c, slug: slugify(c.name) },
      });
      if (!created) await row.update({ icon: c.icon, description: c.description });
    }

    console.log(`Seeded ${categories.length} categories`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await sequelize.close();
  }
})();