module.exports = (sequelize, DataTypes) => {
  const EmergencyContact = sequelize.define(
    "EmergencyContact",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      relationship: { type: DataTypes.STRING, allowNull: true }, // Mother, Partner, Friend
      isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: "emergency_contacts" }
  );

  EmergencyContact.associate = (models) => {
    EmergencyContact.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(EmergencyContact, { foreignKey: "userId", as: "emergencyContacts", onDelete: "CASCADE" });
  };

  return EmergencyContact;
};