require("dotenv").config();
const { sequelize } = require("../config/db");
const { User, Profile, Post } = require("../models");

const DEMO_PASSWORD = "HerBloomPro2026";

// Demo community members who wrote the starter discussions
const members = [
  { name: "Ama", email: "ama.member@herbloom-demo.com", username: "ama_blooms" },
  { name: "Esi", email: "esi.member@herbloom-demo.com", username: "esi_journey" },
  { name: "Nana", email: "nana.member@herbloom-demo.com", username: "nana_wellness" },
];

const memberPosts = [
  { author: "ama.member@herbloom-demo.com", topic: "period", title: "How do you manage period discomfort?", content: "I would love to hear what healthy habits help other women feel more comfortable during their period.", supportCount: 12 },
  { author: "esi.member@herbloom-demo.com", topic: "pregnancy", title: "What helped you prepare for pregnancy?", content: "I am interested in hearing about people's experiences with preparing for pregnancy and appointments.", supportCount: 8 },
  { author: "nana.member@herbloom-demo.com", topic: "wellness", title: "How do you make time for self-care?", content: "School and work can get busy. What simple wellness habits have worked for you?", supportCount: 15 },
];

// Written by the demo doctors (from professionals.seed.js) → Professional Health Content
const professionalPosts = [
  { author: "ama.mensah@herbloom-demo.com", topic: "period", title: "Understanding Your Menstrual Cycle", content: "The menstrual cycle involves several stages, including menstruation, the follicular phase, ovulation, and the luteal phase. Cycle patterns can vary between individuals. Tracking your cycle can help you understand your own pattern and notice changes that may be worth discussing with a healthcare professional." },
  { author: "efua.owusu@herbloom-demo.com", topic: "general", title: "When Should You Talk to a Healthcare Professional?", content: "Changes in your usual health pattern can have many possible causes. Persistent, severe, or concerning symptoms should be discussed with an appropriate healthcare professional. Keeping track of symptoms, when they occur, and any changes over time can help make a healthcare consultation more useful." },
  { author: "abena.boateng@herbloom-demo.com", topic: "fertility", title: "What Can Affect Fertility?", content: "Fertility is influenced by many factors, and experiences differ from person to person. Age, reproductive health, certain medical conditions, lifestyle factors, and other circumstances can all be relevant. If you have concerns about fertility, a qualified healthcare professional can help you understand your individual situation." },
  { author: "akosua.asante@herbloom-demo.com", topic: "pregnancy", title: "Preparing for a Healthy Pregnancy", content: "Preparing for pregnancy can involve discussing your health history and current medications with a healthcare professional, reviewing recommended health checks, and thinking about healthy habits. Individual recommendations can vary, so professional guidance is important when planning for pregnancy." },
];

(async () => {
  try {
    await sequelize.authenticate();

    // 1. Member accounts + profiles
    for (const m of members) {
      const [user] = await User.findOrCreate({
        where: { email: m.email },
        defaults: {
          name: m.name,
          email: m.email,
          password: DEMO_PASSWORD,
          termsAcceptedAt: new Date(),
          healthDataConsentAt: new Date(),
        },
      });
      const [profile] = await Profile.findOrCreate({ where: { userId: user.id } });
      if (!profile.username) await profile.update({ username: m.username });
    }

    // 2. Posts (skip any that already exist)
    let created = 0;
    let skipped = 0;
    const allPosts = [
      ...memberPosts.map((p) => ({ ...p, isProfessionalContent: false })),
      ...professionalPosts.map((p) => ({ ...p, isProfessionalContent: true, supportCount: 0 })),
    ];

    for (const p of allPosts) {
      const author = await User.findOne({ where: { email: p.author } });
      if (!author) {
        console.warn(`Skipped "${p.title}" — ${p.author} not found. Run professionals.seed.js first.`);
        skipped++;
        continue;
      }

      const [, wasCreated] = await Post.findOrCreate({
        where: { title: p.title, authorId: author.id },
        defaults: {
          authorId: author.id,
          title: p.title,
          content: p.content,
          topic: p.topic,
          isProfessionalContent: p.isProfessionalContent,
          supportCount: p.supportCount,
        },
      });
      if (wasCreated) created++;
      else skipped++;
    }

    console.log(`Community posts: ${created} created, ${skipped} skipped`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await sequelize.close();
  }
})();