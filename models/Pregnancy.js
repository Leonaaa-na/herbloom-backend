const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Pregnancy = sequelize.define("Pregnancy", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    pregnancyStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    currentWeek: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("active", "completed"),
      allowNull: false,
      defaultValue: "active",
    },
  });

  return Pregnancy;
};