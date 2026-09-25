// One row per device a user has allowed notifications on
module.exports = (sequelize, DataTypes) => {
  const PushSubscription = sequelize.define(
    "PushSubscription",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      // The browser's unique address for this device — long, and unique per device
      endpoint: { type: DataTypes.TEXT, allowNull: false, unique: true },
      p256dh: { type: DataTypes.STRING, allowNull: false }, // encryption key
      auth: { type: DataTypes.STRING, allowNull: false }, // encryption secret
      userAgent: { type: DataTypes.STRING, allowNull: true }, // so a person can tell devices apart
      lastUsedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "push_subscriptions" }
  );

  PushSubscription.associate = (models) => {
    PushSubscription.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(PushSubscription, { foreignKey: "userId", as: "pushSubscriptions", onDelete: "CASCADE" });
  };

  return PushSubscription;
};