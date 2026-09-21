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
      symptoms: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }, // ["Cramps", "Headache"]
      mood: { type: DataTypes.STRING, allowNull: true },
      // SymptomsTracker fields
      painLevel: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 10 } },
      painLocation: { type: DataTypes.STRING, allowNull: true },
      stressLevel: { type: DataTypes.STRING, allowNull: true }, // "Low" | "Moderate" | "High"
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