const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Period = sequelize.define("Period", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    flow: {
      type: DataTypes.ENUM("light", "medium", "heavy"),
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return Period;
};