module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    "Comment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      postId: { type: DataTypes.UUID, allowNull: false },
      authorId: { type: DataTypes.UUID, allowNull: false },
      parentId: { type: DataTypes.UUID, allowNull: true }, // set when this is a reply
      content: { type: DataTypes.TEXT, allowNull: false },
    },
    { tableName: "comments" }
  );

  Comment.associate = (models) => {
    Comment.belongsTo(models.Post, { foreignKey: "postId", as: "post" });
    models.Post.hasMany(Comment, { foreignKey: "postId", as: "comments", onDelete: "CASCADE" });

    Comment.belongsTo(models.User, { foreignKey: "authorId", as: "author" });
    models.User.hasMany(Comment, { foreignKey: "authorId", as: "comments", onDelete: "CASCADE" });

    // A comment can have replies, and each reply points back to its parent
    Comment.hasMany(Comment, { foreignKey: "parentId", as: "replies", onDelete: "CASCADE" });
    Comment.belongsTo(Comment, { foreignKey: "parentId", as: "parent" });
  };

  return Comment;
};