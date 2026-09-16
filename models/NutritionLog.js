module.exports = (sequelize, DataTypes) => {
  const NutritionLog = sequelize.define(
    "NutritionLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      mealType: {
        type: DataTypes.ENUM("breakfast", "lunch", "dinner", "snack"),
        allowNull: false,
      },
      description: { type: DataTypes.TEXT, allowNull: false },
      calories: { type: DataTypes.INTEGER, allowNull: true },
      context: {
        type: DataTypes.ENUM("cycle", "pregnancy", "postpartum", "general"),
        defaultValue: "general",
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "nutrition_logs" }
  );

  NutritionLog.associate = (models) => {
    NutritionLog.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(NutritionLog, { foreignKey: "userId", as: "nutritionLogs", onDelete: "CASCADE" });
  };

  return NutritionLog;
};