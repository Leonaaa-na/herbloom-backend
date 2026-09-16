module.exports = (sequelize, DataTypes) => {
  const SavedArticle = sequelize.define(
    "SavedArticle",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      articleId: { type: DataTypes.UUID, allowNull: false },
    },
    {
      tableName: "saved_articles",
      indexes: [{ unique: true, fields: ["userId", "articleId"] }], // can't save twice
    }
  );

  SavedArticle.associate = (models) => {
    SavedArticle.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(SavedArticle, { foreignKey: "userId", as: "saves", onDelete: "CASCADE" });

    SavedArticle.belongsTo(models.Article, { foreignKey: "articleId", as: "article" });
    models.Article.hasMany(SavedArticle, { foreignKey: "articleId", as: "saves", onDelete: "CASCADE" });

    // Lets you do  user.getSavedArticles()
    models.User.belongsToMany(models.Article, {
      through: SavedArticle,
      foreignKey: "userId",
      otherKey: "articleId",
      as: "savedArticles",
    });
    models.Article.belongsToMany(models.User, {
      through: SavedArticle,
      foreignKey: "articleId",
      otherKey: "userId",
      as: "savedBy",
    });
  };

  return SavedArticle;
};