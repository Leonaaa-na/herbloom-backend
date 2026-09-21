module.exports = (sequelize, DataTypes) => {
  const PregnancyHealthLog = sequelize.define(
    "PregnancyHealthLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      pregnancyId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      week: { type: DataTypes.INTEGER, allowNull: true },
      weightKg: { type: DataTypes.FLOAT, allowNull: true },
      bloodPressure: { type: DataTypes.STRING, allowNull: true }, // "120/80"
      symptoms: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      severity: { type: DataTypes.STRING, allowNull: true }, // "Mild" | "Moderate" | "Severe"
      mood: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "pregnancy_health_logs" }
  );

  PregnancyHealthLog.associate = (models) => {
    PregnancyHealthLog.belongsTo(models.Pregnancy, { foreignKey: "pregnancyId", as: "pregnancy" });
    models.Pregnancy.hasMany(PregnancyHealthLog, { foreignKey: "pregnancyId", as: "healthLogs", onDelete: "CASCADE" });

    PregnancyHealthLog.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(PregnancyHealthLog, { foreignKey: "userId", as: "pregnancyHealthLogs", onDelete: "CASCADE" });
  };

  return PregnancyHealthLog;
};