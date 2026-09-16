module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      appointmentId: { type: DataTypes.UUID, allowNull: true }, // set when paying for a consultation
      reference: { type: DataTypes.STRING, allowNull: false, unique: true }, // Paystack reference
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false }, // in GHS (Paystack wants pesewas = amount * 100)
      currency: { type: DataTypes.STRING, defaultValue: "GHS" },
      purpose: {
        type: DataTypes.ENUM("subscription", "appointment", "consultation", "other"),
        defaultValue: "subscription",
      },
      status: {
        type: DataTypes.ENUM("pending", "success", "failed", "abandoned"),
        defaultValue: "pending",
      },
      channel: { type: DataTypes.STRING, allowNull: true }, // card, mobile_money
      gatewayResponse: { type: DataTypes.JSONB, allowNull: true }, // raw Paystack verify payload
      paidAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "payments" }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(Payment, { foreignKey: "userId", as: "payments" });

    Payment.belongsTo(models.Appointment, { foreignKey: "appointmentId", as: "appointment" });
    models.Appointment.hasOne(Payment, { foreignKey: "appointmentId", as: "payment", onDelete: "SET NULL" });
  };

  return Payment;
};