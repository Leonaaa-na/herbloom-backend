const { PartnerShare, User, Cycle, CycleLog, Pregnancy, Appointment } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendEmail, escapeHtml } = require("../config/mailer");

// Owner invites a partner by email → gets a share code
const invitePartner = async (owner, { partnerEmail, permissions }) => {
  const existing = await PartnerShare.findOne({ where: { userId: owner.id, partnerEmail } });
  if (existing && existing.status !== "revoked") throw new ApiError(409, "You already invited this partner");

  const share = existing
    ? await existing.update({ status: "pending", permissions, partnerUserId: null, acceptedAt: null })
    : await PartnerShare.create({ userId: owner.id, partnerEmail, ...(permissions && { permissions }) });

  try {
    await sendEmail({
      to: partnerEmail,
      subject: `${escapeHtml(owner.name)} wants to share their HerBloom journey with you`,
      html: `
        <p>Hi,</p>
        <p>${escapeHtml(owner.name)} invited you to follow their cycle on HerBloom.</p>
        <p>Create an account (or log in) and enter this code under <b>Partner Sharing</b>:</p>
        <h2 style="letter-spacing:4px">${share.shareCode}</h2>
      `,
    });
  } catch (err) {
    console.error("Partner invite email failed:", err.message); // still return the code
  }

  return share;
};

const getMyShares = (userId) =>
  PartnerShare.findAll({
    where: { userId },
    include: [{ association: "partner", attributes: ["id", "name", "email"] }],
    order: [["createdAt", "DESC"]],
  });

const revokeShare = async (userId, id) => {
  const share = await PartnerShare.findOne({ where: { id, userId } });
  if (!share) throw new ApiError(404, "Share not found");
  return share.update({ status: "revoked" });
};

const updatePermissions = async (userId, id, permissions) => {
  const share = await PartnerShare.findOne({ where: { id, userId } });
  if (!share) throw new ApiError(404, "Share not found");
  return share.update({ permissions: { ...share.permissions, ...permissions } });
};

// Partner enters the code
const acceptShare = async (partner, shareCode) => {
  const share = await PartnerShare.findOne({ where: { shareCode: shareCode.toUpperCase().trim() } });
  if (!share || share.status === "revoked") throw new ApiError(404, "Invalid code");
  if (share.userId === partner.id) throw new ApiError(400, "You can't share with yourself");
  return share.update({ status: "active", partnerUserId: partner.id, acceptedAt: new Date() });
};

// What's been shared with me
const getSharedWithMe = (partnerUserId) =>
  PartnerShare.findAll({
    where: { partnerUserId, status: "active" },
    include: [{ association: "owner", attributes: ["id", "name"] }],
  });

// The partner's view of the owner's data — filtered by permissions
const getSharedData = async (partnerUserId, shareId) => {
  const share = await PartnerShare.findOne({
    where: { id: shareId, partnerUserId, status: "active" },
    include: [{ association: "owner", attributes: ["id", "name"] }],
  });
  if (!share) throw new ApiError(404, "Share not found");

  const p = share.permissions || {};
  const ownerId = share.userId;
  const data = { owner: share.owner };

  if (p.cycle) {
    data.currentCycle = await Cycle.findOne({ where: { userId: ownerId }, order: [["startDate", "DESC"]] });
  }
  if (p.symptoms) {
    data.recentLogs = await CycleLog.findAll({ where: { userId: ownerId }, order: [["date", "DESC"]], limit: 7 });
  }
  if (p.pregnancy) {
    data.pregnancy = await Pregnancy.findOne({ where: { userId: ownerId, status: "active" } });
  }
  if (p.appointments) {
    data.upcomingAppointments = await Appointment.findAll({
      where: { userId: ownerId, status: ["pending", "confirmed"] },
      include: ["professional"],
      order: [["scheduledAt", "ASC"]],
    });
  }
  return data;
};

module.exports = {
  invitePartner,
  getMyShares,
  revokeShare,
  updatePermissions,
  acceptShare,
  getSharedWithMe,
  getSharedData,
};