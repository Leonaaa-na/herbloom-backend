module.exports = (sequelize, DataTypes) => {
  const MedicationLog = sequelize.define(
    "MedicationLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      medicationId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      scheduledFor: { type: DataTypes.DATE, allowNull: false },
      takenAt: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM("taken", "skipped", "missed"),
        defaultValue: "taken",
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "medication_logs" }
  );

  MedicationLog.associate = (models) => {
    MedicationLog.belongsTo(models.Medication, { foreignKey: "medicationId", as: "medication" });
    models.Medication.hasMany(MedicationLog, { foreignKey: "medicationId", as: "logs", onDelete: "CASCADE" });

    MedicationLog.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(MedicationLog, { foreignKey: "userId", as: "medicationLogs", onDelete: "CASCADE" });
  };

  return MedicationLog;
};