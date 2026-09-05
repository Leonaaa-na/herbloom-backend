const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Medication = sequelize.define("Medication", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    dosage: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return Medication;
};