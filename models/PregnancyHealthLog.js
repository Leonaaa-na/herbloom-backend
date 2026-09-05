const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PregnancyHealthLog = sequelize.define("PregnancyHealthLog", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    bloodPressure: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    mood: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    symptoms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return PregnancyHealthLog;
};