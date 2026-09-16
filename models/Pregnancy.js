module.exports = (sequelize, DataTypes) => {
  const Pregnancy = sequelize.define(
    "Pregnancy",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      lastMenstrualPeriod: { type: DataTypes.DATEONLY, allowNull: false },
      dueDate: { type: DataTypes.DATEONLY, allowNull: true }, // auto = LMP + 280 days
      status: {
        type: DataTypes.ENUM("active", "postpartum", "ended"),
        defaultValue: "active",
      },
      babyNickname: { type: DataTypes.STRING, allowNull: true },
      isFirstPregnancy: { type: DataTypes.BOOLEAN, defaultValue: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      // Postpartum transition
      deliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
      deliveryType: { type: DataTypes.ENUM("vaginal", "c_section"), allowNull: true },
      endedAt: { type: DataTypes.DATEONLY, allowNull: true },
      // Not stored — worked out every time it's read
      currentWeek: {
        type: DataTypes.VIRTUAL,
        get() {
          const lmp = this.getDataValue("lastMenstrualPeriod");
          if (!lmp) return null;
          const days = Math.floor((Date.now() - new Date(lmp).getTime()) / 86400000);
          return Math.max(0, Math.min(42, Math.floor(days / 7)));
        },
      },
      trimester: {
        type: DataTypes.VIRTUAL,
        get() {
          const week = this.currentWeek;
          if (week === null) return null;
          return week < 13 ? 1 : week < 27 ? 2 : 3;
        },
      },
    },
    {
      tableName: "pregnancies",
      hooks: {
        beforeValidate: (pregnancy) => {
          if (!pregnancy.dueDate && pregnancy.lastMenstrualPeriod) {
            const due = new Date(pregnancy.lastMenstrualPeriod);
            due.setDate(due.getDate() + 280);
            pregnancy.dueDate = due.toISOString().slice(0, 10);
          }
        },
      },
    }
  );

  Pregnancy.associate = (models) => {
    Pregnancy.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    models.User.hasMany(Pregnancy, { foreignKey: "userId", as: "pregnancies", onDelete: "CASCADE" });
  };

  return Pregnancy;
};