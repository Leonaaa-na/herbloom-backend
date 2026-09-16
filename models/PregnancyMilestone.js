module.exports = (sequelize, DataTypes) => {
  const PregnancyMilestone = sequelize.define(
    "PregnancyMilestone",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      pregnancyId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      week: { type: DataTypes.INTEGER, allowNull: true },
      type: {
        type: DataTypes.ENUM("scan", "test", "appointment", "symptom", "movement", "custom"),
        defaultValue: "custom",
      },
      imageUrl: { type: DataTypes.STRING, allowNull: true }, // Cloudinary (scan photo)
      imagePublicId: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: "pregnancy_milestones" }
  );

  PregnancyMilestone.associate = (models) => {
    PregnancyMilestone.belongsTo(models.Pregnancy, { foreignKey: "pregnancyId", as: "pregnancy" });
    models.Pregnancy.hasMany(PregnancyMilestone, { foreignKey: "pregnancyId", as: "milestones", onDelete: "CASCADE" });

    PregnancyMilestone.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(PregnancyMilestone, { foreignKey: "userId", as: "pregnancyMilestones", onDelete: "CASCADE" });
  };

  return PregnancyMilestone;
};