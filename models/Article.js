const slugify = require("../utils/slugify");

module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define(
    "Article",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      categoryId: { type: DataTypes.UUID, allowNull: true },
      authorId: { type: DataTypes.UUID, allowNull: true }, // admin / professional who posted it
      title: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      summary: { type: DataTypes.TEXT, allowNull: true },
      content: { type: DataTypes.TEXT, allowNull: false },
      // Where the information comes from (shown on every card)
      type: {
        type: DataTypes.ENUM("Medical Article", "Personal Experience"),
        defaultValue: "Medical Article",
      },
      sourceName: { type: DataTypes.STRING, allowNull: true }, // "World Health Organization (WHO)"
      sourceAuthor: { type: DataTypes.STRING, allowNull: true }, // "World Health Organization"
      sourceUrl: { type: DataTypes.STRING, allowNull: true },
      publishedYear: { type: DataTypes.STRING, allowNull: true }, // "2024"
      coverImageUrl: { type: DataTypes.STRING, allowNull: true }, // Cloudinary
      coverImagePublicId: { type: DataTypes.STRING, allowNull: true },
      tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      readTimeMinutes: { type: DataTypes.INTEGER, allowNull: true },
      isPremium: { type: DataTypes.BOOLEAN, defaultValue: false },
      isPublished: { type: DataTypes.BOOLEAN, defaultValue: true },
      views: { type: DataTypes.INTEGER, defaultValue: 0 },
      // Weekly health tip
      isWeeklyTip: { type: DataTypes.BOOLEAN, defaultValue: false }, // the one currently featured
      lastFeaturedAt: { type: DataTypes.DATE, allowNull: true }, // so the rotation doesn't repeat itself
    },
    {
      tableName: "articles",
      hooks: {
        beforeValidate: (article) => {
          if (!article.slug && article.title) article.slug = slugify(article.title);
          if (!article.readTimeMinutes && article.content) {
            article.readTimeMinutes = Math.max(1, Math.ceil(article.content.split(/\s+/).length / 200));
          }
        },
      },
    }
  );

  Article.associate = (models) => {
    Article.belongsTo(models.Category, { foreignKey: "categoryId", as: "category" });
    models.Category.hasMany(Article, { foreignKey: "categoryId", as: "articles", onDelete: "SET NULL" });

    Article.belongsTo(models.User, { foreignKey: "authorId", as: "author" });
    models.User.hasMany(Article, { foreignKey: "authorId", as: "articles", onDelete: "SET NULL" });
  };

  return Article;
};