module.exports = (sequelize, DataTypes) => {
  const Support = sequelize.define(
    "Support",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      postId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
    },
    {
      tableName: "supports",
      indexes: [{ unique: true, fields: ["postId", "userId"] }],
    }
  );

  Support.associate = (models) => {
    Support.belongsTo(models.Post, { foreignKey: "postId", as: "post" });
    models.Post.hasMany(Support, { foreignKey: "postId", as: "supports", onDelete: "CASCADE" });

    Support.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(Support, { foreignKey: "userId", as: "supports", onDelete: "CASCADE" });
  };

  return Support;
};