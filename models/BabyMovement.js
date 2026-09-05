const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const BabyMovement = sequelize.define("BabyMovement", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    time: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    movementCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return BabyMovement;
};