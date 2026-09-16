module.exports = (sequelize, DataTypes) => {
  const Facility = sequelize.define(
    "Facility",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      type: {
        type: DataTypes.ENUM("hospital", "clinic", "maternity_home", "pharmacy", "ambulance", "hotline", "police", "other"),
        allowNull: false,
      },
      address: { type: DataTypes.STRING, allowNull: true },
      city: { type: DataTypes.STRING, allowNull: true },
      region: { type: DataTypes.STRING, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      emergencyPhone: { type: DataTypes.STRING, allowNull: true },
      website: { type: DataTypes.STRING, allowNull: true },
      latitude: { type: DataTypes.FLOAT, allowNull: true },
      longitude: { type: DataTypes.FLOAT, allowNull: true },
      is24Hours: { type: DataTypes.BOOLEAN, defaultValue: false },
      services: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }, // ["maternity", "emergency"]
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: "facilities" }
  );

  return Facility;
};