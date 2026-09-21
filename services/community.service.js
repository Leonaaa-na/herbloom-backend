const { Post, Comment, Support, User, Professional, Op } = require("../models");
const ApiError = require("../utils/ApiError");
const notify = require("../utils/notify");
const cloudinary = require("../config/cloudinary");

const TOPICS = ["general", "period", "pregnancy", "fertility", "postpartum", "mental_health", "nutrition", "wellness"];

// Author with username, avatar and verified badge
const AUTHOR_INCLUDE = {
  association: "author",
  attributes: ["id", "name", "role"],
  include: [
    { association: "profile", attributes: ["username", "avatarUrl"] },
    { association: "professionalProfile", attributes: ["id", "specialty", "verificationStatus"] },
  ],
};

// Hide the author on anonymous posts (unless you're looking at your own)
const present = (post, viewerId, supportedIds = new Set()) => {
  const p = post.toJSON();
  if (p.isAnonymous && p.authorId !== viewerId) {
    p.author = { id: null, name: "Anonymous", profile: null, professionalProfile: null };
  }
  p.isMine = !!viewerId && p.authorId === viewerId;
  p.isSupported = supportedIds.has(p.id);
  return p;
};

const isVerifiedPro = async (user) => {
  if (user.role !== "professional") return false;
  const pro = await Professional.findOne({ where: { userId: user.id } });
  return !!pro && pro.isVerified;
};

// ---------- Posts ----------

const createPost = async (user, data, file) => {
  const professional = await isVerifiedPro(user);
  return Post.create({
    ...data,
    authorId: user.id,
    isProfessionalContent: professional, // verified professionals' posts show in "Professional Health Content"
    isAnonymous: professional ? false : !!data.isAnonymous,
    ...(file && { imageUrl: file.path, imagePublicId: file.filename }),
  });
};

// ?topic=&professional=true&search=&authorId=&mine=true&page=&limit=
const getPosts = async ({ topic, professional, search, authorId, mine, page = 1, limit = 15 } = {}, viewerId = null) => {
  const where = {};
  if (topic) where.topic = topic;
  if (professional === "true") where.isProfessionalContent = true;
  if (mine === "true" && viewerId) {
    where.authorId = viewerId; // your own posts, anonymous ones included
  } else if (authorId) {
    where.authorId = authorId;
    where.isAnonymous = false;
  }
  if (search) where[Op.or] = [{ title: { [Op.iLike]: `%${search}%` } }, { content: { [Op.iLike]: `%${search}%` } }];

  const perPage = Math.min(Number(limit) || 15, 100);
  const currentPage = Math.max(Number(page) || 1, 1);

  const { rows, count } = await Post.findAndCountAll({
    where,
    include: [AUTHOR_INCLUDE],
    order: [["isPinned", "DESC"], ["createdAt", "DESC"]],
    limit: perPage,
    offset: (currentPage - 1) * perPage,
    distinct: true,
  });

  let supported = new Set();
  if (viewerId && rows.length) {
    const mineSupports = await Support.findAll({ where: { userId: viewerId, postId: rows.map((r) => r.id) }, attributes: ["postId"] });
    supported = new Set(mineSupports.map((s) => s.postId));
  }

  return { posts: rows.map((p) => present(p, viewerId, supported)), total: count, page: currentPage, pages: Math.ceil(count / perPage) };
};

const getPost = async (id, viewerId = null) => {
  const post = await Post.findByPk(id, { include: [AUTHOR_INCLUDE] });
  if (!post) throw new ApiError(404, "Post not found");
  const supported = viewerId && (await Support.findOne({ where: { userId: viewerId, postId: id } })) ? new Set([id]) : new Set();
  return present(post, viewerId, supported);
};

const updatePost = async (user, id, data) => {
  const post = await Post.findByPk(id);
  if (!post) throw new ApiError(404, "Post not found");
  if (post.authorId !== user.id && user.role !== "admin") throw new ApiError(403, "Not your post");
  await post.update(data);
  return getPost(id, user.id);
};

const deletePost = async (user, id) => {
  const post = await Post.findByPk(id);
  if (!post) throw new ApiError(404, "Post not found");
  if (post.authorId !== user.id && user.role !== "admin") throw new ApiError(403, "Not your post");
  if (post.imagePublicId) await cloudinary.uploader.destroy(post.imagePublicId);
  await post.destroy();
  return true;
};

// ---------- Support (like) ----------

const toggleSupport = async (user, postId) => {
  const post = await Post.findByPk(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const existing = await Support.findOne({ where: { userId: user.id, postId } });
  if (existing) {
    await existing.destroy();
    const supportCount = Math.max(0, post.supportCount - 1);
    await post.update({ supportCount });
    return { supported: false, supportCount };
  }

  await Support.create({ userId: user.id, postId });
  await post.increment("supportCount");
  if (post.authorId !== user.id) {
    await notify(post.authorId, { title: `${user.name} supported your post`, body: (post.title || post.content).slice(0, 80), type: "community", data: { postId } });
  }
  return { supported: true, supportCount: post.supportCount + 1 };
};

// ---------- Comments & replies ----------

const getComments = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) throw new ApiError(404, "Post not found");
  return Comment.findAll({
    where: { postId, parentId: null },
    include: [
      AUTHOR_INCLUDE,
      { association: "replies", include: [AUTHOR_INCLUDE], separate: true, order: [["createdAt", "ASC"]] },
    ],
    order: [["createdAt", "ASC"]],
  });
};

const addComment = async (user, postId, { content, parentId = null }) => {
  const post = await Post.findByPk(postId);
  if (!post) throw new ApiError(404, "Post not found");

  let parent = null;
  if (parentId) {
    parent = await Comment.findOne({ where: { id: parentId, postId } });
    if (!parent) throw new ApiError(404, "Comment to reply to not found");
    if (parent.parentId) parentId = parent.parentId; // keep it one level deep: reply to the top-level comment
  }

  const comment = await Comment.create({ postId, authorId: user.id, parentId, content });
  await post.increment("commentCount");

  const target = parent ? parent.authorId : post.authorId;
  if (target !== user.id) {
    await notify(target, {
      title: parent ? `${user.name} replied to your comment` : `${user.name} commented on your post`,
      body: content.slice(0, 80),
      type: "community",
      data: { postId, commentId: comment.id },
    });
  }
  return Comment.findByPk(comment.id, { include: [AUTHOR_INCLUDE] });
};

const deleteComment = async (user, id) => {
  const comment = await Comment.findByPk(id);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (comment.authorId !== user.id && user.role !== "admin") throw new ApiError(403, "Not your comment");
  const replies = await Comment.count({ where: { parentId: id } });
  await comment.destroy(); // replies cascade
  await Post.decrement("commentCount", { by: 1 + replies, where: { id: comment.postId } });
  return true;
};

// ---------- Profiles & stats ----------

const getUserProfile = async (id) => {
  const user = await User.findOne({
    where: { id, isActive: true },
    attributes: ["id", "name", "role", "createdAt"],
    include: [
      { association: "profile", attributes: ["username", "avatarUrl", "bio", "city"] },
      { association: "professionalProfile", attributes: ["id", "specialty", "title", "hospital", "verificationStatus"] },
    ],
  });
  if (!user) throw new ApiError(404, "User not found");
  const postCount = await Post.count({ where: { authorId: id, isAnonymous: false } });
  return { ...user.toJSON(), postCount };
};

// For the logged-in user's own profile page
const getMyStats = async (userId) => {
  const [posts, supported, comments] = await Promise.all([
    Post.count({ where: { authorId: userId } }),
    Support.count({ where: { userId } }),
    Comment.count({ where: { authorId: userId } }),
  ]);
  return { posts, supported, comments };
};

module.exports = {
  TOPICS, createPost, getPosts, getPost, updatePost, deletePost, toggleSupport,
  getComments, addComment, deleteComment, getUserProfile, getMyStats,
};