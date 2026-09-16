const slugify = require("../utils/slugify");

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false, unique: true }, // Menstrual Health, Pregnancy, Fertility...
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      icon: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: "categories",
      hooks: {
        beforeValidate: (category) => {
          if (!category.slug && category.name) category.slug = slugify(category.name);
        },
      },
    }
  );

  return Category;
};