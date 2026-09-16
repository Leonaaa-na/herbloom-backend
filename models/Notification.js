module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: true },
      type: {
        type: DataTypes.ENUM("period", "pregnancy", "medication", "appointment", "wellness", "community", "message", "payment", "emergency", "system"),
        defaultValue: "system",
      },
      isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
      data: { type: DataTypes.JSONB, allowNull: true }, // e.g. { appointmentId: "..." } so the frontend can deep-link
    },
    { tableName: "notifications" }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(Notification, { foreignKey: "userId", as: "notifications", onDelete: "CASCADE" });
  };

  return Notification;
};