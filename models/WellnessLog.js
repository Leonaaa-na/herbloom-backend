module.exports = (sequelize, DataTypes) => {
  const WellnessLog = sequelize.define(
    "WellnessLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      mood: { type: DataTypes.STRING, allowNull: true },
      energyLevel: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
      stressLevel: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
      sleepHours: { type: DataTypes.FLOAT, allowNull: true },
      waterMl: { type: DataTypes.INTEGER, allowNull: true },
      exerciseMinutes: { type: DataTypes.INTEGER, allowNull: true },
      exerciseType: { type: DataTypes.STRING, allowNull: true },
      context: {
        type: DataTypes.ENUM("cycle", "pregnancy", "postpartum", "general"),
        defaultValue: "general",
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "wellness_logs",
      indexes: [{ unique: true, fields: ["userId", "date"] }],
    }
  );

  WellnessLog.associate = (models) => {
    WellnessLog.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(WellnessLog, { foreignKey: "userId", as: "wellnessLogs", onDelete: "CASCADE" });
  };

  return WellnessLog;
};