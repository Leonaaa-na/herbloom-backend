const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const MAX_SIZE_MB = process.env.MAX_UPLOAD_MB ? Number(process.env.MAX_UPLOAD_MB) : 5;

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
  return multer({ storage, limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 } });
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