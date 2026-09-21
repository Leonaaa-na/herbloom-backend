const { Professional, Op, sequelize } = require("../models");
const ApiError = require("../utils/ApiError");
const cloudinary = require("../config/cloudinary");

// Never sent to the public: licence number, uploaded documents, who approved them
const PUBLIC_ATTRS = { exclude: ["licenseNumber", "verificationDocumentUrl", "verificationDocumentPublicId", "verifiedById"] };

// ?specialty=&city=&search=&page=&limit=   (only verified ones are shown publicly)
const getProfessionals = async ({ specialty, city, search, page = 1, limit = 12 } = {}) => {
  const where = { verificationStatus: "verified" };
  if (specialty) where.specialty = { [Op.iLike]: specialty };
  if (city) where.city = { [Op.iLike]: `%${city}%` };
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { specialty: { [Op.iLike]: `%${search}%` } },
      { hospital: { [Op.iLike]: `%${search}%` } },
      { city: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const perPage = Math.min(Number(limit) || 12, 100);
  const currentPage = Math.max(Number(page) || 1, 1);

  const { rows, count } = await Professional.findAndCountAll({
    where,
    attributes: PUBLIC_ATTRS,
    order: [["rating", "DESC"], ["name", "ASC"]],
    limit: perPage,
    offset: (currentPage - 1) * perPage,
  });
  return { professionals: rows, total: count, page: currentPage, pages: Math.ceil(count / perPage) };
};

const getSpecialties = async () => {
  const rows = await Professional.findAll({
    where: { verificationStatus: "verified" },
    attributes: [[sequelize.fn("DISTINCT", sequelize.col("specialty")), "specialty"]],
    order: [["specialty", "ASC"]],
    raw: true,
  });
  return rows.map((r) => r.specialty);
};

const getProfessionalById = async (id) => {
  const pro = await Professional.findOne({ where: { id, verificationStatus: "verified" }, attributes: PUBLIC_ATTRS });
  if (!pro) throw new ApiError(404, "Professional not found");
  return pro;
};

// ---------- The professional's own account ----------

// A normal user applies to become a professional (starts as "pending")
const apply = async (user, data) => {
  const existing = await Professional.findOne({ where: { userId: user.id } });
  if (existing) throw new ApiError(409, "You already have a professional profile");

  const pro = await Professional.create({ ...data, userId: user.id, name: data.name || user.name, email: data.email || user.email });
  await user.update({ role: "professional" });
  return pro;
};

const getMine = async (user) => {
  const pro = await Professional.findOne({ where: { userId: user.id } });
  if (!pro) throw new ApiError(404, "You don't have a professional profile yet");
  return pro;
};

const updateMine = async (user, data) => {
  const pro = await getMine(user);
  return pro.update(data);
};

const uploadAvatar = async (user, file) => {
  if (!file) throw new ApiError(400, "No image uploaded");
  const pro = await getMine(user);
  if (pro.avatarPublicId) await cloudinary.uploader.destroy(pro.avatarPublicId);
  return pro.update({ avatarUrl: file.path, avatarPublicId: file.filename });
};

// "Verified professional proof" — upload licence / ID; goes back to pending for admin review
const uploadVerification = async (user, file, licenseNumber) => {
  if (!file) throw new ApiError(400, "No document uploaded");
  const pro = await getMine(user);
  if (pro.verificationDocumentPublicId) await cloudinary.uploader.destroy(pro.verificationDocumentPublicId);
  return pro.update({
    verificationDocumentUrl: file.path,
    verificationDocumentPublicId: file.filename,
    ...(licenseNumber && { licenseNumber }),
    verificationStatus: "pending",
    verifiedAt: null,
    verifiedById: null,
  });
};

// ---------- Admin ----------

const adminCreate = (data) => Professional.create(data);

const adminList = ({ status } = {}) =>
  Professional.findAll({
    where: status ? { verificationStatus: status } : {},
    include: [{ association: "user", attributes: ["id", "name", "email"] }],
    order: [["createdAt", "DESC"]],
  });

const adminVerify = async (admin, id, status) => {
  const pro = await Professional.findByPk(id);
  if (!pro) throw new ApiError(404, "Professional not found");
  return pro.update({
    verificationStatus: status,
    verifiedAt: status === "verified" ? new Date() : null,
    verifiedById: status === "verified" ? admin.id : null,
  });
};

const adminDelete = async (id) => {
  const pro = await Professional.findByPk(id);
  if (!pro) throw new ApiError(404, "Professional not found");
  if (pro.avatarPublicId) await cloudinary.uploader.destroy(pro.avatarPublicId);
  if (pro.verificationDocumentPublicId) await cloudinary.uploader.destroy(pro.verificationDocumentPublicId);
  await pro.destroy();
  return true;
};

module.exports = {
  getProfessionals, getSpecialties, getProfessionalById,
  apply, getMine, updateMine, uploadAvatar, uploadVerification,
  adminCreate, adminList, adminVerify, adminDelete,
};