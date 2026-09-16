require("dotenv").config();
const { sequelize } = require("../config/db");
const { Category } = require("../models");
const slugify = require("../utils/slugify");

const categories = [
  { name: "Menstrual Health", description: "Cycles, periods, PMS and everything in between" },
  { name: "Pregnancy", description: "Trimester by trimester guidance" },
  { name: "Fertility", description: "Conceiving, ovulation and fertility awareness" },
  { name: "Nutrition", description: "Eating well through every stage" },
  { name: "Mental Wellbeing", description: "Mood, stress, anxiety and support" },
  { name: "Sleep", description: "Rest, insomnia and sleep hygiene" },
  { name: "Wellness & Exercise", description: "Movement, fitness and self-care" },
  { name: "Postpartum", description: "Recovery, feeding and the fourth trimester" },
].map((c) => ({ ...c, slug: slugify(c.name) }));

(async () => {
  try {
    await sequelize.authenticate();
    await Category.bulkCreate(categories, { updateOnDuplicate: ["description"] });
    console.log(`Seeded ${categories.length} categories`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await sequelize.close();
  }
})();