module.exports = (sequelize, DataTypes) => {
  const Reminder = sequelize.define(
    "Reminder",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      type: {
        type: DataTypes.ENUM("period", "pregnancy", "medication", "appointment", "wellness", "custom"),
        defaultValue: "custom",
      },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      time: { type: DataTypes.STRING, allowNull: false }, // "08:30"
      notes: { type: DataTypes.TEXT, allowNull: true },
      repeat: {
        type: DataTypes.ENUM("none", "daily", "weekly", "monthly"),
        defaultValue: "none",
      },
      completed: { type: DataTypes.BOOLEAN, defaultValue: false },
      automatic: { type: DataTypes.BOOLEAN, defaultValue: false }, // created by the system
      referenceId: { type: DataTypes.UUID, allowNull: true }, // the cycle / appointment / medication it came from
      lastSentAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "reminders" }
  );

  Reminder.associate = (models) => {
    Reminder.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(Reminder, { foreignKey: "userId", as: "reminders", onDelete: "CASCADE" });
  };

  return Reminder;
};