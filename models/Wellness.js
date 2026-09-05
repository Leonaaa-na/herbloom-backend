const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Wellness = sequelize.define("Wellness", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    mood: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    sleepHours: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    waterIntake: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return Wellness;
};