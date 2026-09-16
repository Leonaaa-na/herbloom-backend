module.exports = (sequelize, DataTypes) => {
  const ContractionSession = sequelize.define(
    "ContractionSession",
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
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "contraction_sessions" }
  );

  ContractionSession.associate = (models) => {
    ContractionSession.belongsTo(models.Pregnancy, { foreignKey: "pregnancyId", as: "pregnancy" });
    models.Pregnancy.hasMany(ContractionSession, { foreignKey: "pregnancyId", as: "contractionSessions", onDelete: "CASCADE" });

    ContractionSession.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(ContractionSession, { foreignKey: "userId", as: "contractionSessions", onDelete: "CASCADE" });
  };

  return ContractionSession;
};