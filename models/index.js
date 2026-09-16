const fs = require("fs");
const path = require("path");
const { DataTypes, Op } = require("sequelize");
const { sequelize } = require("../config/db");

const db = {};

// 1. Load every model file in this folder (except index.js)
fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js" && file.endsWith(".js"))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// 2. Wire associations once every model is loaded
Object.values(db).forEach((model) => {
  if (typeof model.associate === "function") model.associate(db);
});

db.sequelize = sequelize;
db.Op = Op;

module.exports = db;