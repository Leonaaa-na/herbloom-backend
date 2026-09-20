const fs = require("fs");
const path = require("path");
const { DataTypes, Op } = require("sequelize");
const { sequelize } = require("../config/db");

const db = {};
// Simple in-memory cache for frequently-read, rarely-changing data
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

const getCache = (key) => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.value;
  cache.delete(key);
  return undefined;
};

const setCache = (key, value) => {
  cache.set(key, { value, ts: Date.now() });
};

const invalidateCache = (key) => cache.delete(key);

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
db.cache = { getCache, setCache, invalidateCache };

module.exports = db;