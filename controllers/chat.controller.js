const service = require("../services/chat.service");

const startConversation = async (req, res) =>
  res.status(201).json({ success: true, data: await service.startConversation(req.user, req.body.professionalId, req.body.appointmentId) });

const getConversations = async (req, res) => res.json({ success: true, data: await service.getConversations(req.user) });

const getMessages = async (req, res) => res.json({ success: true, data: await service.getMessages(req.user, req.params.id, req.query) });

const sendMessage = async (req, res) =>
  res.status(201).json({ success: true, data: await service.sendMessage(req.user, req.params.id, req.body, req.file) });

const markRead = async (req, res) => {
  await service.markRead(req.user, req.params.id);
  res.json({ success: true, message: "Marked as read" });
};

const closeConversation = async (req, res) =>
  res.json({ success: true, message: "Conversation closed", data: await service.closeConversation(req.user, req.params.id) });

module.exports = { startConversation, getConversations, getMessages, sendMessage, markRead, closeConversation };