const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Symptom = sequelize.define("Symptom", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    symptom: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    severity: {
      type: DataTypes.ENUM("mild", "moderate", "severe"),
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return Symptom;
};