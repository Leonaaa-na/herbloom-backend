module.exports = (sequelize, DataTypes) => {
  const NotificationSetting = sequelize.define(
    "NotificationSetting",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      notificationsEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
      periodNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
      pregnancyNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
      medicationNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
      appointmentNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
      wellnessNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
      notificationSound: { type: DataTypes.BOOLEAN, defaultValue: true },
      vibration: { type: DataTypes.BOOLEAN, defaultValue: true },
      emailNotifications: { type: DataTypes.BOOLEAN, defaultValue: true }, // appointment / reset emails
      // How early reminders fire: 0 = on time, 15 = 15 minutes before, 1440 = 1 day before
      reminderLeadMinutes: { type: DataTypes.INTEGER, defaultValue: 0 },
      // Reminders due in this window wait until it ends
      quietHoursEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
      quietHoursStart: { type: DataTypes.STRING, defaultValue: "22:00" },
      quietHoursEnd: { type: DataTypes.STRING, defaultValue: "07:00" },
    },
    { tableName: "notification_settings" }
  );

  NotificationSetting.associate = (models) => {
    NotificationSetting.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasOne(NotificationSetting, {
      foreignKey: "userId",
      as: "notificationSettings",
      onDelete: "CASCADE",
    });
  };

  return NotificationSetting;
};