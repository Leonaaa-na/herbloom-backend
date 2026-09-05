const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Cycle = sequelize.define("Cycle", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    cycleLength: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    periodLength: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  return Cycle;
};