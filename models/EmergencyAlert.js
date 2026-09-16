module.exports = (sequelize, DataTypes) => {
  const EmergencyAlert = sequelize.define(
    "EmergencyAlert",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      type: {
        type: DataTypes.ENUM("sos", "medical", "safety", "other"),
        defaultValue: "sos",
      },
      latitude: { type: DataTypes.FLOAT, allowNull: true },
      longitude: { type: DataTypes.FLOAT, allowNull: true },
      address: { type: DataTypes.STRING, allowNull: true },
      message: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM("active", "resolved", "cancelled"),
        defaultValue: "active",
      },
      resolvedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "emergency_alerts" }
  );

  EmergencyAlert.associate = (models) => {
    EmergencyAlert.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(EmergencyAlert, { foreignKey: "userId", as: "emergencyAlerts", onDelete: "CASCADE" });
  };

  return EmergencyAlert;
};