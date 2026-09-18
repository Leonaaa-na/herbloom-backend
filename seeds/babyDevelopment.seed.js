require("dotenv").config();
const { sequelize } = require("../config/db");
const { BabyDevelopmentWeek } = require("../models");

// Matches the stage breakpoints in your BabyDevelopment.tsx.
// The API always shows the nearest lower seeded week, so seeding at
// 1, 5, 9, 13, 17, 21, 28, 33 recreates the same stages your frontend shows.
const stages = [
  { week: 1, emoji: "🌱", title: "Early development", babyDevelopment: "This is an early stage of pregnancy. Important changes are beginning as the pregnancy develops." },
  { week: 5, emoji: "🌱", title: "Early growth", babyDevelopment: "Early structures are developing rapidly during this stage of pregnancy." },
  { week: 9, emoji: "👶🏽", title: "First trimester", babyDevelopment: "Major developmental changes are taking place during the first trimester." },
  { week: 13, emoji: "🌸", title: "Growing and developing", babyDevelopment: "Your pregnancy continues to develop as your baby grows and changes." },
  { week: 17, emoji: "✨", title: "Halfway milestone", babyDevelopment: "You're around the halfway point of a typical 40-week pregnancy." },
  { week: 21, emoji: "💗", title: "Second trimester", babyDevelopment: "Your pregnancy is continuing through the second trimester, with ongoing growth and development." },
  { week: 28, emoji: "🤰🏽", title: "Third trimester", babyDevelopment: "Your pregnancy has entered the third trimester and continues toward the expected due date." },
  { week: 33, emoji: "🌸", title: "Getting closer", babyDevelopment: "You're in the later stages of pregnancy. Continue following your healthcare team's guidance." },
];

const weeks = stages.map((s) => ({
  week: s.week,
  babyDevelopment: `${s.emoji} ${s.title} — ${s.babyDevelopment}`,
}));

(async () => {
  try {
    await sequelize.authenticate();
    await BabyDevelopmentWeek.destroy({ where: {} }); // clear the old placeholder data first
    await BabyDevelopmentWeek.bulkCreate(weeks);
    console.log(`Seeded ${weeks.length} pregnancy stages`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await sequelize.close();
  }
})();