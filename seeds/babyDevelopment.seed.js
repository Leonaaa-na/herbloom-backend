require("dotenv").config();
const { sequelize } = require("../config/db");
const { BabyDevelopmentWeek } = require("../models");

const weeks = [
  { week: 4, sizeComparison: "a poppy seed", lengthCm: 0.1, weightGrams: 0.04, babyDevelopment: "The fertilised egg has implanted and the placenta and umbilical cord are starting to form.", motherChanges: "You may miss your period and notice tender breasts or tiredness.", tips: ["Start taking folic acid daily", "Book your first antenatal visit"] },
  { week: 8, sizeComparison: "a raspberry", lengthCm: 1.6, weightGrams: 1, babyDevelopment: "Tiny fingers and toes are forming and the heart beats about 150 times a minute.", motherChanges: "Morning sickness and food aversions are common now.", tips: ["Eat small frequent meals", "Rest when you can"] },
  { week: 12, sizeComparison: "a lime", lengthCm: 5.4, weightGrams: 14, babyDevelopment: "All major organs are formed. Baby can make a fist and suck a thumb.", motherChanges: "Nausea often eases. End of the first trimester.", tips: ["Ask about the first ultrasound scan", "Stay hydrated"] },
  { week: 16, sizeComparison: "an avocado", lengthCm: 11.6, weightGrams: 100, babyDevelopment: "Baby can hear your voice and the eyes are moving.", motherChanges: "Energy returns and a small bump may show.", tips: ["Talk and sing to your baby", "Begin sleeping on your side"] },
  { week: 20, sizeComparison: "a banana", lengthCm: 16.4, weightGrams: 300, babyDevelopment: "Halfway there. Baby is covered in fine hair and you may feel first movements.", motherChanges: "Anatomy scan time. Backache can begin.", tips: ["Attend the anatomy scan", "Start a kick-count habit soon"] },
  { week: 24, sizeComparison: "an ear of corn", lengthCm: 30, weightGrams: 600, babyDevelopment: "Lungs are developing and baby has a regular sleep cycle.", motherChanges: "Glucose screening is usually offered around now.", tips: ["Do the glucose test", "Watch for swelling in hands and face"] },
  { week: 28, sizeComparison: "an aubergine", lengthCm: 37.6, weightGrams: 1000, babyDevelopment: "Eyes open and baby can blink. Third trimester begins.", motherChanges: "Shortness of breath and heartburn are common.", tips: ["Count kicks daily", "Ask about the whooping cough vaccine"] },
  { week: 32, sizeComparison: "a squash", lengthCm: 42.4, weightGrams: 1700, babyDevelopment: "Baby practises breathing and is likely head-down.", motherChanges: "Braxton Hicks practice contractions may start.", tips: ["Start packing your hospital bag", "Write your birth plan"] },
  { week: 36, sizeComparison: "a papaya", lengthCm: 47.4, weightGrams: 2600, babyDevelopment: "Baby drops lower into the pelvis and gains weight fast.", motherChanges: "Easier breathing but more pressure on the bladder.", tips: ["Know the signs of labour", "Confirm your transport plan to the hospital"] },
  { week: 40, sizeComparison: "a small pumpkin", lengthCm: 51.2, weightGrams: 3400, babyDevelopment: "Baby is full term and ready to be born.", motherChanges: "Contractions every 5 minutes lasting 1 minute for 1 hour means it's time.", tips: ["Rest between contractions", "Call your midwife or hospital when labour starts"] },
];

(async () => {
  try {
    await sequelize.authenticate();
    await BabyDevelopmentWeek.bulkCreate(weeks, {
      updateOnDuplicate: ["sizeComparison", "lengthCm", "weightGrams", "babyDevelopment", "motherChanges", "tips"],
    });
    console.log(`Seeded ${weeks.length} baby development weeks`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await sequelize.close();
  }
})();