const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Contraction = sequelize.define("Contraction", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return Contraction;
};