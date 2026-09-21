// Messages sent from the public Contact page
module.exports = (sequelize, DataTypes) => {
  const ContactMessage = sequelize.define(
    "ContactMessage",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: true }, // set if they were logged in
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
      subject: { type: DataTypes.STRING, allowNull: true },
      message: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM("new", "read", "replied"),
        defaultValue: "new",
      },
    },
    { tableName: "contact_messages" }
  );

  ContactMessage.associate = (models) => {
    ContactMessage.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  };

  return ContactMessage;
};