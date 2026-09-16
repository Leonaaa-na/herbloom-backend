const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// makeUploader("articles") → files land in the herbloom/articles folder on Cloudinary
const makeUploader = (folder, { documents = false } = {}) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `herbloom/${folder}`,
      allowed_formats: documents ? ["jpg", "jpeg", "png", "webp", "pdf"] : ["jpg", "jpeg", "png", "webp"],
      resource_type: "auto",
    },
  });
  return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB
};

// After upload:  req.file.path = the URL,  req.file.filename = the public_id (needed to delete later)
module.exports = {
  uploadArticleImage: makeUploader("articles"),
  uploadAvatar: makeUploader("avatars"),
  uploadPostImage: makeUploader("posts"),
  uploadChatAttachment: makeUploader("chat", { documents: true }),
  uploadVerificationDoc: makeUploader("verification", { documents: true }),
  uploadMilestoneImage: makeUploader("milestones"),
};