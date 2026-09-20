const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

// Controlled by DB_SYNC in .env:  safe (default) | alter | force
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    require("../models"); // load every model + association before syncing

    const mode = process.env.DB_SYNC || "safe";
    const isProd = process.env.NODE_ENV === "production";
    let options;
    if (mode === "force") {
      if (isProd) throw new Error("DB_SYNC=force is not allowed in production");
      options = { force: true };
    } else if (mode === "alter") {
      if (isProd) throw new Error("DB_SYNC=alter is not allowed in production");
      options = { alter: true };
    } else {
      options = {};
    }

    await sequelize.sync(options);
    console.log(`Database synchronized successfully (${mode}).`);
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
    process.exit(1);
  }
};

module.exports = sequelize; // keeps your old  require("./config/db")  working
module.exports.sequelize = sequelize; // lets models/index.js do  { sequelize }
module.exports.connectDB = connectDB;