const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const BirthPlan = sequelize.define("BirthPlan", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hospital: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    doctor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deliveryPreference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });
  return BirthPlan;
};