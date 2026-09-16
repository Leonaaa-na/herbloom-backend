module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define(
    "Appointment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      professionalId: { type: DataTypes.UUID, allowNull: false },
      scheduledAt: { type: DataTypes.DATE, allowNull: false },
      durationMinutes: { type: DataTypes.INTEGER, defaultValue: 30 },
      type: {
        type: DataTypes.ENUM("in_person", "virtual", "phone"),
        defaultValue: "in_person",
      },
      context: {
        type: DataTypes.ENUM("general", "pregnancy", "cycle", "postpartum"),
        defaultValue: "general", // lets PregnancyAppointments filter its own
      },
      reason: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM("pending", "confirmed", "completed", "cancelled", "rescheduled"),
        defaultValue: "pending",
      },
      location: { type: DataTypes.STRING, allowNull: true },
      meetingLink: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      previousScheduledAt: { type: DataTypes.DATE, allowNull: true }, // set when rescheduled
      cancellationReason: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "appointments" }
  );

  Appointment.associate = (models) => {
    Appointment.belongsTo(models.User, { foreignKey: "userId", as: "patient" });
    models.User.hasMany(Appointment, { foreignKey: "userId", as: "appointments", onDelete: "CASCADE" });

    Appointment.belongsTo(models.Professional, { foreignKey: "professionalId", as: "professional" });
    models.Professional.hasMany(Appointment, { foreignKey: "professionalId", as: "appointments", onDelete: "CASCADE" });

    // A chat can come from a booking (column already exists on Conversation)
    Appointment.hasOne(models.Conversation, { foreignKey: "appointmentId", as: "conversation", onDelete: "SET NULL" });
    models.Conversation.belongsTo(Appointment, { foreignKey: "appointmentId", as: "appointment" });
  };

  return Appointment;
};