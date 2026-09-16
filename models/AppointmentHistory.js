module.exports = (sequelize, DataTypes) => {
  const AppointmentHistory = sequelize.define(
    "AppointmentHistory",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      appointmentId: { type: DataTypes.UUID, allowNull: false },
      changedById: { type: DataTypes.UUID, allowNull: true }, // who did it
      action: {
        type: DataTypes.ENUM("booked", "confirmed", "rescheduled", "cancelled", "completed"),
        allowNull: false,
      },
      previousScheduledAt: { type: DataTypes.DATE, allowNull: true },
      newScheduledAt: { type: DataTypes.DATE, allowNull: true },
      reason: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "appointment_histories" }
  );

  AppointmentHistory.associate = (models) => {
    AppointmentHistory.belongsTo(models.Appointment, { foreignKey: "appointmentId", as: "appointment" });
    models.Appointment.hasMany(AppointmentHistory, { foreignKey: "appointmentId", as: "history", onDelete: "CASCADE" });

    AppointmentHistory.belongsTo(models.User, { foreignKey: "changedById", as: "changedBy" });
  };

  return AppointmentHistory;
};