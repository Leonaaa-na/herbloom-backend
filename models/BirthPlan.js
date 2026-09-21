module.exports = (sequelize, DataTypes) => {
  const BirthPlan = sequelize.define(
    "BirthPlan",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      pregnancyId: { type: DataTypes.UUID, allowNull: false, unique: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      hospitalName: { type: DataTypes.STRING, allowNull: true },
      hospitalAddress: { type: DataTypes.STRING, allowNull: true },
      hospitalPhone: { type: DataTypes.STRING, allowNull: true },
      doctorName: { type: DataTypes.STRING, allowNull: true }, // "Healthcare provider" on the page
      birthPartner: { type: DataTypes.STRING, allowNull: true },
      preferredDeliveryType: {
        type: DataTypes.ENUM("vaginal", "c_section", "undecided"),
        defaultValue: "undecided",
      },
      painReliefPreferences: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      birthPreferences: { type: DataTypes.TEXT, allowNull: true }, // free-text preferences
      // null = not answered yet, true = hospital gave one, false = use HerBloom's list
      hasHospitalChecklist: { type: DataTypes.BOOLEAN, allowNull: true },
      hospitalBagChecklist: { type: DataTypes.JSONB, defaultValue: [] }, // [{ id, name, completed }]
      hospitalBagPacked: { type: DataTypes.BOOLEAN, defaultValue: false },
      contacts: { type: DataTypes.JSONB, defaultValue: [] }, // [{ id, name, relationship, phone }]
      transportPlan: { type: DataTypes.TEXT, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "birth_plans" }
  );

  BirthPlan.associate = (models) => {
    BirthPlan.belongsTo(models.Pregnancy, { foreignKey: "pregnancyId", as: "pregnancy" });
    models.Pregnancy.hasOne(BirthPlan, { foreignKey: "pregnancyId", as: "birthPlan", onDelete: "CASCADE" });

    BirthPlan.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(BirthPlan, { foreignKey: "userId", as: "birthPlans", onDelete: "CASCADE" });
  };

  return BirthPlan;
};