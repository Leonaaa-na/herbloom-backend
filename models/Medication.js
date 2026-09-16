module.exports = (sequelize, DataTypes) => {
  const Medication = sequelize.define(
    "Medication",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      dosage: { type: DataTypes.STRING, allowNull: true }, // "500mg", "1 tablet"
      frequency: {
        type: DataTypes.ENUM("daily", "twice_daily", "three_times_daily", "weekly", "as_needed", "custom"),
        defaultValue: "daily",
      },
      times: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }, // ["08:00", "20:00"]
      context: {
        type: DataTypes.ENUM("cycle", "pregnancy", "postpartum", "general"),
        defaultValue: "general",
      },
      startDate: { type: DataTypes.DATEONLY, allowNull: true },
      endDate: { type: DataTypes.DATEONLY, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: "medications" }
  );

  Medication.associate = (models) => {
    Medication.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(Medication, { foreignKey: "userId", as: "medications", onDelete: "CASCADE" });
  };

  return Medication;
};