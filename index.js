const express = require("express");
const sequelize = require("./config/db");
const db = require("./models");

const app = express();

const PORT = 5000;

app.use(express.json());

const models = db(sequelize);

app.get("/", (req, res) => {
  res.send("HerBloom Backend is running!");
});

sequelize
  .authenticate()
  .then(() => {
    console.log("PostgreSQL database connected successfully!");

    return sequelize.sync();
  })
  .then(() => {
    console.log("Database tables synchronized successfully!");

    app.listen(PORT, () => {
      console.log(`HerBloom Backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });