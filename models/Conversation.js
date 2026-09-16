module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    "Conversation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      professionalId: { type: DataTypes.UUID, allowNull: false },
      appointmentId: { type: DataTypes.UUID, allowNull: true }, // linked in the Appointment model later
      status: {
        type: DataTypes.ENUM("active", "closed"),
        defaultValue: "active",
      },
      lastMessageAt: { type: DataTypes.DATE, allowNull: true },
      lastMessagePreview: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: "conversations",
      indexes: [{ unique: true, fields: ["userId", "professionalId"] }],
    }
  );

  Conversation.associate = (models) => {
    Conversation.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(Conversation, { foreignKey: "userId", as: "conversations", onDelete: "CASCADE" });

    Conversation.belongsTo(models.Professional, { foreignKey: "professionalId", as: "professional" });
    models.Professional.hasMany(Conversation, { foreignKey: "professionalId", as: "conversations", onDelete: "CASCADE" });
  };

  return Conversation;
};