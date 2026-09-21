const { Profile } = require("../models");
const ApiError = require("../utils/ApiError");
const cloudinary = require("../config/cloudinary");

// Saves a new profile photo (already uploaded to Cloudinary by the upload middleware)
// and deletes the old one so Cloudinary doesn't fill up
const uploadAvatar = async (userId, file) => {
  if (!file) throw new ApiError(400, "No image uploaded");

  const [profile] = await Profile.findOrCreate({ where: { userId } });

  if (profile.avatarPublicId) {
    await cloudinary.uploader.destroy(profile.avatarPublicId).catch(() => undefined);
  }

  return profile.update({ avatarUrl: file.path, avatarPublicId: file.filename });
};

// Removes the photo and goes back to the default icon
const removeAvatar = async (userId) => {
  const [profile] = await Profile.findOrCreate({ where: { userId } });

  if (profile.avatarPublicId) {
    await cloudinary.uploader.destroy(profile.avatarPublicId).catch(() => undefined);
  }

  return profile.update({ avatarUrl: null, avatarPublicId: null });
};

module.exports = { uploadAvatar, removeAvatar };