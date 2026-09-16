module.exports = (sequelize, DataTypes) => {
  const CycleLog = sequelize.define(
    "CycleLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      cycleId: { type: DataTypes.UUID, allowNull: true }, // linked to the cycle it falls in
      date: { type: DataTypes.DATEONLY, allowNull: false },
      flow: {
        type: DataTypes.ENUM("none", "spotting", "light", "medium", "heavy"),
        defaultValue: "none",
      },
      symptoms: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }, // ["cramps", "headache"]
      mood: { type: DataTypes.STRING, allowNull: true },
      temperature: { type: DataTypes.FLOAT, allowNull: true }, // basal body temperature
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "cycle_logs",
      indexes: [{ unique: true, fields: ["userId", "date"] }], // one entry per day
    }
  );

  CycleLog.associate = (models) => {
    CycleLog.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(CycleLog, { foreignKey: "userId", as: "cycleLogs", onDelete: "CASCADE" });

    CycleLog.belongsTo(models.Cycle, { foreignKey: "cycleId", as: "cycle" });
    models.Cycle.hasMany(CycleLog, { foreignKey: "cycleId", as: "logs", onDelete: "SET NULL" });
  };

  return CycleLog;
};