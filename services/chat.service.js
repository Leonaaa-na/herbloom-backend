const { Conversation, Message, Professional, Notification, Op } = require("../models");
const ApiError = require("../utils/ApiError");

const CONVERSATION_INCLUDE = [
  { association: "user", attributes: ["id", "name"] },
  { association: "professional", attributes: ["id", "name", "title", "specialty", "avatarUrl", "userId"] },
];

// Is this user the patient or the professional in this thread?
const getConversationFor = async (user, id) => {
  const convo = await Conversation.findOne({ where: { id }, include: CONVERSATION_INCLUDE });
  if (!convo) throw new ApiError(404, "Conversation not found");
  const isPatient = convo.userId === user.id;
  const isPro = convo.professional && convo.professional.userId === user.id;
  if (!isPatient && !isPro) throw new ApiError(403, "Not your conversation");
  return { convo, isPatient };
};

// Patient starts (or reopens) a chat with a professional
const startConversation = async (user, professionalId, appointmentId = null) => {
  const pro = await Professional.findOne({ where: { id: professionalId, verificationStatus: "verified" } });
  if (!pro) throw new ApiError(404, "Professional not found");
  if (!pro.acceptsChat) throw new ApiError(400, "This professional isn't accepting chats right now");
  if (!pro.userId) throw new ApiError(400, "This professional hasn't set up chat yet");

  const [convo] = await Conversation.findOrCreate({
    where: { userId: user.id, professionalId },
    defaults: { appointmentId },
  });
  if (convo.status === "closed") await convo.update({ status: "active" });
  return Conversation.findByPk(convo.id, { include: CONVERSATION_INCLUDE });
};

// My inbox (works for both sides)
const getConversations = async (user) => {
  const where = { userId: user.id };
  if (user.role === "professional") {
    const pro = await Professional.findOne({ where: { userId: user.id } });
    if (pro) where[Op.or] = [{ userId: user.id }, { professionalId: pro.id }];
  }
  const convos = await Conversation.findAll({ where, include: CONVERSATION_INCLUDE, order: [["lastMessageAt", "DESC NULLS LAST"]] });

  // Unread count per thread
  return Promise.all(
    convos.map(async (c) => {
      const unread = await Message.count({ where: { conversationId: c.id, isRead: false, senderId: { [Op.ne]: user.id } } });
      return { ...c.toJSON(), unreadCount: unread };
    })
  );
};

const getMessages = async (user, conversationId, { before, limit = 50 } = {}) => {
  const { convo } = await getConversationFor(user, conversationId);
  const where = { conversationId: convo.id };
  if (before) where.createdAt = { [Op.lt]: new Date(before) }; // for "load older" scrolling
  const messages = await Message.findAll({
    where,
    include: [{ association: "sender", attributes: ["id", "name"] }],
    order: [["createdAt", "DESC"]],
    limit: Number(limit),
  });
  return { conversation: convo, messages: messages.reverse() };
};

const sendMessage = async (user, conversationId, { content }, file) => {
  const { convo, isPatient } = await getConversationFor(user, conversationId);
  if (convo.status === "closed") throw new ApiError(400, "This conversation is closed");
  if (!content && !file) throw new ApiError(400, "Message is empty");

  const message = await Message.create({
    conversationId: convo.id,
    senderId: user.id,
    content: content || null,
    ...(file && {
      attachmentUrl: file.path,
      attachmentPublicId: file.filename,
      attachmentType: file.mimetype === "application/pdf" ? "document" : "image",
    }),
  });

  await convo.update({ lastMessageAt: new Date(), lastMessagePreview: (content || "📎 Attachment").slice(0, 80) });

  // Notify the other side
  const recipientId = isPatient ? convo.professional.userId : convo.userId;
  await Notification.create({
    userId: recipientId,
    title: `New message from ${user.name}`,
    body: (content || "Sent an attachment").slice(0, 120),
    type: "message",
    data: { conversationId: convo.id },
  });

  return Message.findByPk(message.id, { include: [{ association: "sender", attributes: ["id", "name"] }] });
};

const markRead = async (user, conversationId) => {
  const { convo } = await getConversationFor(user, conversationId);
  await Message.update(
    { isRead: true, readAt: new Date() },
    { where: { conversationId: convo.id, isRead: false, senderId: { [Op.ne]: user.id } } }
  );
  return true;
};

const closeConversation = async (user, conversationId) => {
  const { convo } = await getConversationFor(user, conversationId);
  return convo.update({ status: "closed" });
};

module.exports = { startConversation, getConversations, getMessages, sendMessage, markRead, closeConversation };