module.exports = (sequelize, DataTypes) => {
  const Professional = sequelize.define(
    "Professional",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: true, unique: true }, // their login (role = professional)
      name: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: true }, // Dr., Midwife
      specialty: { type: DataTypes.STRING, allowNull: false }, // Gynaecologist, Psychologist, Nutritionist...
      hospital: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.STRING, allowNull: true },
      city: { type: DataTypes.STRING, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true, validate: { isEmail: true } },
      bio: { type: DataTypes.TEXT, allowNull: true },
      avatarUrl: { type: DataTypes.STRING, allowNull: true },
      avatarPublicId: { type: DataTypes.STRING, allowNull: true },
      yearsOfExperience: { type: DataTypes.INTEGER, allowNull: true },
      languages: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      consultationFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      availableDays: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }, // ["Mon", "Wed"]
      isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
      acceptsChat: { type: DataTypes.BOOLEAN, defaultValue: true },
      rating: { type: DataTypes.FLOAT, defaultValue: 0 },
      // Verified professional proof
      licenseNumber: { type: DataTypes.STRING, allowNull: true },
      verificationDocumentUrl: { type: DataTypes.STRING, allowNull: true }, // Cloudinary upload
      verificationDocumentPublicId: { type: DataTypes.STRING, allowNull: true },
      verificationStatus: {
        type: DataTypes.ENUM("pending", "verified", "rejected"),
        defaultValue: "pending",
      },
      verifiedAt: { type: DataTypes.DATE, allowNull: true },
      verifiedById: { type: DataTypes.UUID, allowNull: true }, // admin who approved
      isVerified: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue("verificationStatus") === "verified";
        },
      },
    },
    { tableName: "professionals" }
  );

  Professional.associate = (models) => {
    Professional.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasOne(Professional, { foreignKey: "userId", as: "professionalProfile", onDelete: "SET NULL" });

    Professional.belongsTo(models.User, { foreignKey: "verifiedById", as: "verifiedBy" });
  };

  return Professional;
};