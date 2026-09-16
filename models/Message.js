module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    "Message",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      conversationId: { type: DataTypes.UUID, allowNull: false },
      senderId: { type: DataTypes.UUID, allowNull: false }, // a User id (patient or the professional's account)
      content: { type: DataTypes.TEXT, allowNull: true },
      attachmentUrl: { type: DataTypes.STRING, allowNull: true }, // Cloudinary
      attachmentPublicId: { type: DataTypes.STRING, allowNull: true },
      attachmentType: { type: DataTypes.ENUM("image", "document"), allowNull: true },
      isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
      readAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "messages" }
  );

  Message.associate = (models) => {
    Message.belongsTo(models.Conversation, { foreignKey: "conversationId", as: "conversation" });
    models.Conversation.hasMany(Message, { foreignKey: "conversationId", as: "messages", onDelete: "CASCADE" });

    Message.belongsTo(models.User, { foreignKey: "senderId", as: "sender" });
    models.User.hasMany(Message, { foreignKey: "senderId", as: "sentMessages", onDelete: "CASCADE" });
  };

  return Message;
};