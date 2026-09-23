require("dotenv").config();
const { sequelize } = require("../config/db");
const { User } = require("../models");

// Usage: node seeds/admin.seed.js someone@example.com
const email = (process.argv[2] || "").toLowerCase().trim();

(async () => {
  try {
    if (!email) {
      console.error("Give the email: node seeds/admin.seed.js someone@example.com");
      return;
    }

    await sequelize.authenticate();
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error(`No account found for ${email}. Sign up with it first, then run this again.`);
      return;
    }

    await user.update({ role: "admin" });
    console.log(`${user.name} (${email}) is now an admin.`);
  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    await sequelize.close();
  }
})();