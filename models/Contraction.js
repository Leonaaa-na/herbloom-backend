module.exports = (sequelize, DataTypes) => {
  const Contraction = sequelize.define(
    "Contraction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sessionId: { type: DataTypes.UUID, allowNull: false },
      startedAt: { type: DataTypes.DATE, allowNull: false },
      endedAt: { type: DataTypes.DATE, allowNull: true },
      durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
      intervalSeconds: { type: DataTypes.INTEGER, allowNull: true }, // gap since the previous one
      intensity: {
        type: DataTypes.ENUM("mild", "moderate", "strong"),
        allowNull: true,
      },
    },
    { tableName: "contractions" }
  );

  Contraction.associate = (models) => {
    Contraction.belongsTo(models.ContractionSession, { foreignKey: "sessionId", as: "session" });
    models.ContractionSession.hasMany(Contraction, { foreignKey: "sessionId", as: "contractions", onDelete: "CASCADE" });
  };

  return Contraction;
};