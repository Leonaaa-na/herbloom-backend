const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const PartnerShare = sequelize.define(
    "PartnerShare",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false }, // owner of the data
      partnerEmail: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
      partnerUserId: { type: DataTypes.UUID, allowNull: true }, // filled once the partner accepts
      shareCode: { type: DataTypes.STRING, allowNull: false, unique: true },
      status: {
        type: DataTypes.ENUM("pending", "active", "revoked"),
        defaultValue: "pending",
      },
      permissions: {
        type: DataTypes.JSONB,
        defaultValue: { cycle: true, symptoms: true, pregnancy: true, appointments: false },
      },
      acceptedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "partner_shares",
      hooks: {
        beforeValidate: (share) => {
          if (!share.shareCode) {
            share.shareCode = crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "3C3A989E"
          }
        },
      },
    }
  );

  PartnerShare.associate = (models) => {
    PartnerShare.belongsTo(models.User, { foreignKey: "userId", as: "owner" });
    models.User.hasMany(PartnerShare, { foreignKey: "userId", as: "partnerShares", onDelete: "CASCADE" });

    PartnerShare.belongsTo(models.User, { foreignKey: "partnerUserId", as: "partner" });
    models.User.hasMany(PartnerShare, { foreignKey: "partnerUserId", as: "sharedWithMe" });
  };

  return PartnerShare;
};