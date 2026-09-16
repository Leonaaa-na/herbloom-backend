module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    "Subscription",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      paymentId: { type: DataTypes.UUID, allowNull: true },
      plan: {
        type: DataTypes.ENUM("free", "monthly", "yearly"),
        defaultValue: "free",
      },
      status: {
        type: DataTypes.ENUM("active", "expired", "cancelled"),
        defaultValue: "active",
      },
      startDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      endDate: { type: DataTypes.DATE, allowNull: true },
      autoRenew: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: "subscriptions" }
  );

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(Subscription, { foreignKey: "userId", as: "subscriptions", onDelete: "CASCADE" });

    Subscription.belongsTo(models.Payment, { foreignKey: "paymentId", as: "payment" });
    models.Payment.hasOne(Subscription, { foreignKey: "paymentId", as: "subscription", onDelete: "SET NULL" });
  };

  return Subscription;
};