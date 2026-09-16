module.exports = (sequelize, DataTypes) => {
  const BabyMovement = sequelize.define(
    "BabyMovement",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      pregnancyId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      endedAt: { type: DataTypes.DATE, allowNull: true },
      kickCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "baby_movements" }
  );

  BabyMovement.associate = (models) => {
    BabyMovement.belongsTo(models.Pregnancy, { foreignKey: "pregnancyId", as: "pregnancy" });
    models.Pregnancy.hasMany(BabyMovement, { foreignKey: "pregnancyId", as: "movements", onDelete: "CASCADE" });

    BabyMovement.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(BabyMovement, { foreignKey: "userId", as: "babyMovements", onDelete: "CASCADE" });
  };

  return BabyMovement;
};