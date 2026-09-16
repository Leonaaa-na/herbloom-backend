module.exports = (sequelize, DataTypes) => {
  const Cycle = sequelize.define(
    "Cycle",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      startDate: { type: DataTypes.DATEONLY, allowNull: false }, // first day of period
      endDate: { type: DataTypes.DATEONLY, allowNull: true }, // last day of period
      cycleLength: { type: DataTypes.INTEGER, allowNull: true }, // days from this start to the next
      periodLength: { type: DataTypes.INTEGER, allowNull: true },
      // Predictions (calculated by the service when a cycle is saved)
      predictedNextStart: { type: DataTypes.DATEONLY, allowNull: true },
      predictedOvulation: { type: DataTypes.DATEONLY, allowNull: true },
      fertileWindowStart: { type: DataTypes.DATEONLY, allowNull: true },
      fertileWindowEnd: { type: DataTypes.DATEONLY, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "cycles" }
  );

  Cycle.associate = (models) => {
    Cycle.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(Cycle, { foreignKey: "userId", as: "cycles", onDelete: "CASCADE" });
  };

  return Cycle;
};