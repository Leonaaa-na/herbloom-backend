// The user's emergency medical card — shown on the emergency screen, owner-only
module.exports = (sequelize, DataTypes) => {
  const EmergencyInfo = sequelize.define(
    "EmergencyInfo",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      bloodGroup: { type: DataTypes.STRING, allowNull: true },
      allergies: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      medicalConditions: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      currentMedications: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      isPregnant: { type: DataTypes.BOOLEAN, defaultValue: false },
      pregnancyWeek: { type: DataTypes.INTEGER, allowNull: true },
      doctorName: { type: DataTypes.STRING, allowNull: true },
      doctorPhone: { type: DataTypes.STRING, allowNull: true },
      preferredHospital: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true }, // anything a first responder should know
    },
    { tableName: "emergency_infos" }
  );

  EmergencyInfo.associate = (models) => {
    EmergencyInfo.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasOne(EmergencyInfo, { foreignKey: "userId", as: "emergencyInfo", onDelete: "CASCADE" });
  };

  return EmergencyInfo;
};