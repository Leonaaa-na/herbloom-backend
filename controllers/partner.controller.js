const service = require("../services/partner.service");

const invitePartner = async (req, res) => {
  const share = await service.invitePartner(req.user, req.body);
  res.status(201).json({ success: true, message: "Invite sent", data: share });
};

const getMyShares = async (req, res) => {
  res.json({ success: true, data: await service.getMyShares(req.user.id) });
};

const revokeShare = async (req, res) => {
  const share = await service.revokeShare(req.user.id, req.params.id);
  res.json({ success: true, message: "Sharing stopped", data: share });
};

const updatePermissions = async (req, res) => {
  const share = await service.updatePermissions(req.user.id, req.params.id, req.body.permissions || {});
  res.json({ success: true, message: "Permissions updated", data: share });
};

const acceptShare = async (req, res) => {
  const share = await service.acceptShare(req.user, req.body.shareCode);
  res.json({ success: true, message: "You're now connected", data: share });
};

const getSharedWithMe = async (req, res) => {
  res.json({ success: true, data: await service.getSharedWithMe(req.user.id) });
};

const getSharedData = async (req, res) => {
  res.json({ success: true, data: await service.getSharedData(req.user.id, req.params.id) });
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