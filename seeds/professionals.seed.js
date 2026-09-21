require("dotenv").config();
const { sequelize } = require("../config/db");
const { User, Professional } = require("../models");

// Every demo doctor gets a login so they can receive and reply to chats.
// Same password for all — fine for a demo, never for real accounts.
const DEMO_PASSWORD = "HerBloomPro2026";

const professionals = [
  { name: "Dr. Ama Mensah", email: "ama.mensah@herbloom-demo.com", specialty: "Obstetrician & Gynaecologist", city: "Accra", hospital: "Women's Health Centre", yearsOfExperience: 8, qualifications: ["MBChB", "Membership in Obstetrics & Gynaecology", "Women's Health Specialist"], bio: "Dr. Ama Mensah provides care and guidance relating to reproductive health, pregnancy, menstrual health and women's wellbeing.", consultationAreas: ["General Women's Health", "Pregnancy Care", "Menstrual Health"], rating: 4.9 },
  { name: "Dr. Efua Owusu", email: "efua.owusu@herbloom-demo.com", specialty: "Women's Health Specialist", city: "Kumasi", hospital: "Women's Wellness Clinic", yearsOfExperience: 6, qualifications: ["MBChB", "Women's Health Certification", "Reproductive Health Specialist"], bio: "Dr. Efua Owusu focuses on women's health and reproductive wellbeing, providing education and professional guidance.", consultationAreas: ["Women's Health", "Reproductive Health", "Wellbeing"], rating: 4.8 },
  { name: "Dr. Abena Boateng", email: "abena.boateng@herbloom-demo.com", specialty: "Fertility Specialist", city: "Accra", hospital: "Reproductive Health Centre", yearsOfExperience: 10, qualifications: ["MBChB", "Fertility Medicine Certification", "Reproductive Health Specialist"], bio: "Dr. Abena Boateng provides professional guidance relating to fertility and reproductive health.", consultationAreas: ["Fertility", "Reproductive Health", "Conception Planning"], rating: 4.9 },
  { name: "Dr. Akosua Asante", email: "akosua.asante@herbloom-demo.com", specialty: "Midwife", city: "Tema", hospital: null, yearsOfExperience: 7, qualifications: ["Registered Midwife", "Maternal Health Certification", "Pregnancy Care Specialist"], bio: "Dr. Akosua Asante supports women through pregnancy, maternal health education and preparation for childbirth.", consultationAreas: ["Pregnancy Care", "Maternal Health", "Birth Preparation"], rating: 4.7 },
  { name: "Dr. Adwoa Owusu", email: "adwoa.owusu@herbloom-demo.com", specialty: "Psychologist", city: "Accra", hospital: null, yearsOfExperience: 7, qualifications: ["Psychology Degree", "Professional Psychology Certification", "Mental Wellbeing Specialist"], bio: "Dr. Adwoa Owusu provides professional psychological support and wellbeing-focused guidance for women.", consultationAreas: ["Mental Wellbeing", "Stress Management", "Emotional Support"], rating: 4.8 },
  { name: "Dr. Yaa Asante", email: "yaa.asante@herbloom-demo.com", specialty: "Nutritionist / Dietitian", city: "Kumasi", hospital: null, yearsOfExperience: 6, qualifications: ["Nutrition and Dietetics Certification", "Registered Dietitian", "Women's Nutrition Specialist"], bio: "Dr. Yaa Asante provides nutrition and dietary guidance supporting women's health and wellbeing.", consultationAreas: ["Women's Nutrition", "Healthy Eating", "Pregnancy Nutrition"], rating: 4.6 },
  { name: "Dr. Mabel Addo", email: "mabel.addo@herbloom-demo.com", specialty: "Reproductive Health Specialist", city: "Accra", hospital: null, yearsOfExperience: 9, qualifications: ["MBChB", "Reproductive Health Certification", "Women's Health Specialist"], bio: "Dr. Mabel Addo focuses on reproductive health education, women's health and reproductive wellbeing.", consultationAreas: ["Reproductive Health", "Menstrual Health", "Sexual Health Education"], rating: 4.7 },
  { name: "Dr. Kofi Mensah", email: "kofi.mensah@herbloom-demo.com", specialty: "General Practitioner", city: "Tema", hospital: null, yearsOfExperience: 8, qualifications: ["MBChB", "General Medical Practice Certification", "Primary Care Experience"], bio: "Dr. Kofi Mensah provides general medical care and can help users understand common health concerns and appropriate next steps.", consultationAreas: ["General Health", "Primary Care", "Health Guidance"], rating: 4.6 },
  { name: "Dr. Linda Boateng", email: "linda.boateng@herbloom-demo.com", specialty: "Paediatrician", city: "Accra", hospital: null, yearsOfExperience: 11, qualifications: ["MBChB", "Paediatrics Certification", "Child Health Specialist"], bio: "Dr. Linda Boateng provides professional guidance relating to children's health and development.", consultationAreas: ["Child Health", "Child Development", "Maternal & Child Health"], rating: 4.9 },
  { name: "Dr. Akua Frimpong", email: "akua.frimpong@herbloom-demo.com", specialty: "Maternal & Child Health Specialist", city: "Cape Coast", hospital: null, yearsOfExperience: 8, qualifications: ["MBChB", "Maternal & Child Health Certification", "Family Health Specialist"], bio: "Dr. Akua Frimpong focuses on maternal and child health, providing education and professional guidance across the pregnancy and family health journey.", consultationAreas: ["Maternal Health", "Child Health", "Family Health"], rating: 4.8 },
];

(async () => {
  try {
    await sequelize.authenticate();
    let created = 0;
    let updated = 0;

    for (const p of professionals) {
      // 1. Login account (role = professional)
      const [user] = await User.findOrCreate({
        where: { email: p.email },
        defaults: {
          name: p.name,
          email: p.email,
          password: DEMO_PASSWORD, // hashed by the User model hook
          role: "professional",
          isVerified: true,
          termsAcceptedAt: new Date(),
          healthDataConsentAt: new Date(),
        },
      });

      // 2. Public professional profile, already verified
      const values = {
        name: p.name,
        title: p.specialty === "Midwife" ? "Midwife" : "Dr.",
        specialty: p.specialty,
        city: p.city,
        hospital: p.hospital,
        email: p.email,
        bio: p.bio,
        yearsOfExperience: p.yearsOfExperience,
        qualifications: p.qualifications,
        consultationAreas: p.consultationAreas,
        languages: ["English", "Twi"],
        availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        isAvailable: true,
        acceptsChat: true,
        rating: p.rating,
        verificationStatus: "verified",
      };

      const existing = await Professional.findOne({ where: { userId: user.id } });
      if (existing) {
        await existing.update(values);
        updated++;
      } else {
        await Professional.create({ ...values, userId: user.id, verifiedAt: new Date() });
        created++;
      }
    }

    console.log(`Professionals: ${created} created, ${updated} updated`);
    console.log(`Demo doctor login password: ${DEMO_PASSWORD}`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await sequelize.close();
  }
})();