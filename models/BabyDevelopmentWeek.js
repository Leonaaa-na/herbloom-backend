module.exports = (sequelize, DataTypes) => {
  const BabyDevelopmentWeek = sequelize.define(
    "BabyDevelopmentWeek",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      week: { type: DataTypes.INTEGER, allowNull: false, unique: true, validate: { min: 1, max: 42 } },
      sizeComparison: { type: DataTypes.STRING, allowNull: true }, // "a lime"
      lengthCm: { type: DataTypes.FLOAT, allowNull: true },
      weightGrams: { type: DataTypes.FLOAT, allowNull: true },
      babyDevelopment: { type: DataTypes.TEXT, allowNull: true },
      motherChanges: { type: DataTypes.TEXT, allowNull: true },
      tips: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      imageUrl: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: "baby_development_weeks" }
  );

  return BabyDevelopmentWeek;
};