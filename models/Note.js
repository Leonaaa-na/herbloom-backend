module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define(
    "Note",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: true },
      content: { type: DataTypes.TEXT, allowNull: false },
      context: {
        type: DataTypes.ENUM("cycle", "pregnancy", "postpartum", "general"),
        defaultValue: "general",
      },
      date: { type: DataTypes.DATEONLY, allowNull: true },
      isPinned: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: "notes" }
  );

  Note.associate = (models) => {
    Note.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(Note, { foreignKey: "userId", as: "notes", onDelete: "CASCADE" });
  };

  return Note;
};