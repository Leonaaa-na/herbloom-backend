module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    "Post",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      authorId: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: true },
      content: { type: DataTypes.TEXT, allowNull: false },
      topic: {
        type: DataTypes.ENUM("general", "period", "pregnancy", "fertility", "postpartum", "mental_health", "nutrition", "wellness"),
        defaultValue: "general",
      },
      imageUrl: { type: DataTypes.STRING, allowNull: true }, // Cloudinary
      imagePublicId: { type: DataTypes.STRING, allowNull: true },
      isAnonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
      isProfessionalContent: { type: DataTypes.BOOLEAN, defaultValue: false }, // posted by a verified professional
      isPinned: { type: DataTypes.BOOLEAN, defaultValue: false },
      tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      supportCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      commentCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    { tableName: "posts" }
  );

  Post.associate = (models) => {
    Post.belongsTo(models.User, { foreignKey: "authorId", as: "author" });
    models.User.hasMany(Post, { foreignKey: "authorId", as: "posts", onDelete: "CASCADE" });
  };

  return Post;
};