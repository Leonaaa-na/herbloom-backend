module.exports = (sequelize, DataTypes) => {
  const Profile = sequelize.define(
    "Profile",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      username: { type: DataTypes.STRING, allowNull: true, unique: true }, // shown in community
      dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
      avatarUrl: { type: DataTypes.STRING, allowNull: true },
      avatarPublicId: { type: DataTypes.STRING, allowNull: true }, // Cloudinary
      bio: { type: DataTypes.TEXT, allowNull: true },
      city: { type: DataTypes.STRING, allowNull: true },
      country: { type: DataTypes.STRING, defaultValue: "Ghana" },
      heightCm: { type: DataTypes.FLOAT, allowNull: true },
      weightKg: { type: DataTypes.FLOAT, allowNull: true },
      bloodGroup: { type: DataTypes.STRING, allowNull: true },
      // Cycle setup
      averageCycleLength: { type: DataTypes.INTEGER, defaultValue: 28 },
      averagePeriodLength: { type: DataTypes.INTEGER, defaultValue: 5 },
      lastPeriodDate: { type: DataTypes.DATEONLY, allowNull: true },
      // Drives which mode the app opens in
      lifeStage: {
        type: DataTypes.ENUM("menstrual", "trying_to_conceive", "pregnant", "postpartum"),
        defaultValue: "menstrual",
      },
      // App settings (AppSettings.tsx)
      theme: { type: DataTypes.ENUM("light", "dark", "system"), defaultValue: "system" },
      language: { type: DataTypes.STRING, defaultValue: "en" },
      dateFormat: { type: DataTypes.STRING, defaultValue: "DD/MM/YYYY" },
      weekStartsOn: { type: DataTypes.ENUM("sunday", "monday"), defaultValue: "monday" },
      units: { type: DataTypes.ENUM("metric", "imperial"), defaultValue: "metric" },
      discreetMode: { type: DataTypes.BOOLEAN, defaultValue: false }, // hides health wording in notifications
    },
    { tableName: "profiles" }
  );

  Profile.associate = (models) => {
    Profile.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasOne(Profile, { foreignKey: "userId", as: "profile", onDelete: "CASCADE" });
  };

  return Profile;
};