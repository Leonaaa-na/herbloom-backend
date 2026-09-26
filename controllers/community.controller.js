const service = require("../services/community.service");
const pick = require("../utils/pick");

const POST_FIELDS = ["title", "content", "topic", "isAnonymous", "tags", "asProfessional"];

// Multipart sends text, so normalise booleans/arrays
const normalise = (body) => {
  if (typeof body.isAnonymous === "string") body.isAnonymous = body.isAnonymous === "true";
  if (typeof body.asProfessional === "string") body.asProfessional = body.asProfessional === "true";
  if (typeof body.tags === "string") {
    try { body.tags = JSON.parse(body.tags); } catch { body.tags = body.tags.split(",").map((t) => t.trim()).filter(Boolean); }
  }
  return body;
};

const getTopics = async (req, res) => res.json({ success: true, data: service.TOPICS });

const createPost = async (req, res) =>
  res.status(201).json({ success: true, message: "Posted", data: await service.createPost(req.user, pick(normalise(req.body), POST_FIELDS), req.file) });
const getPosts = async (req, res) => res.json({ success: true, data: await service.getPosts(req.query, req.user ? req.user.id : null) });
const getPost = async (req, res) => res.json({ success: true, data: await service.getPost(req.params.id, req.user ? req.user.id : null) });
const updatePost = async (req, res) =>
  res.json({ success: true, message: "Post updated", data: await service.updatePost(req.user, req.params.id, pick(normalise(req.body), POST_FIELDS)) });
const deletePost = async (req, res) => {
  await service.deletePost(req.user, req.params.id);
  res.json({ success: true, message: "Post deleted" });
};

const toggleSupport = async (req, res) => res.json({ success: true, data: await service.toggleSupport(req.user, req.params.id) });

const getComments = async (req, res) => res.json({ success: true, data: await service.getComments(req.params.id) });
const addComment = async (req, res) =>
  res.status(201).json({ success: true, message: "Comment added", data: await service.addComment(req.user, req.params.id, pick(req.body, ["content", "parentId"])) });
const deleteComment = async (req, res) => {
  await service.deleteComment(req.user, req.params.id);
  res.json({ success: true, message: "Comment deleted" });
};

const getUserProfile = async (req, res) => res.json({ success: true, data: await service.getUserProfile(req.params.id) });
const getMyStats = async (req, res) => res.json({ success: true, data: await service.getMyStats(req.user.id) });
const canPostAsProfessional = async (req, res) => res.json({ success: true, data: await service.canPostAsProfessional(req.user) });

module.exports = {
  getTopics, createPost, getPosts, getPost, updatePost, deletePost, toggleSupport,
  getComments, addComment, deleteComment, getUserProfile, getMyStats, canPostAsProfessional,
};