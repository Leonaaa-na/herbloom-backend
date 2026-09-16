const { EmergencyContact, EmergencyAlert, EmergencyInfo, Facility, Op } = require("../models");
const ApiError = require("../utils/ApiError");
const notify = require("../utils/notify");
const { distanceKm } = require("../utils/geo");

// ---------- Contacts ----------

const getContacts = (userId) =>
  EmergencyContact.findAll({ where: { userId }, order: [["isPrimary", "DESC"], ["name", "ASC"]] });

const createContact = async (userId, data) => {
  if (data.isPrimary) await EmergencyContact.update({ isPrimary: false }, { where: { userId } }); // only one primary
  return EmergencyContact.create({ ...data, userId });
};

const updateContact = async (userId, id, data) => {
  const contact = await EmergencyContact.findOne({ where: { id, userId } });
  if (!contact) throw new ApiError(404, "Contact not found");
  if (data.isPrimary) await EmergencyContact.update({ isPrimary: false }, { where: { userId } });
  return contact.update(data);
};

const deleteContact = async (userId, id) => {
  const contact = await EmergencyContact.findOne({ where: { id, userId } });
  if (!contact) throw new ApiError(404, "Contact not found");
  await contact.destroy();
  return true;
};

// ---------- Medical info card (owner only) ----------

const getInfo = async (userId) => {
  const [info] = await EmergencyInfo.findOrCreate({ where: { userId } });
  return info;
};

const updateInfo = async (userId, data) => {
  const info = await getInfo(userId);
  return info.update(data);
};

// ---------- Facilities ----------

const HOTLINE_TYPES = ["hotline", "ambulance", "police"];

// ?type=&city=&search=
const getFacilities = ({ type, city, search } = {}) => {
  const where = { isActive: true };
  if (type) where.type = type;
  if (city) where.city = { [Op.iLike]: `%${city}%` };
  if (search) where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { address: { [Op.iLike]: `%${search}%` } }];
  return Facility.findAll({ where, order: [["type", "ASC"], ["name", "ASC"]] });
};

const getHotlines = () => Facility.findAll({ where: { isActive: true, type: HOTLINE_TYPES }, order: [["name", "ASC"]] });

// ?lat=&lng=&radiusKm=25&type=hospital  → sorted by distance
const getNearby = async ({ lat, lng, radiusKm = 25, type } = {}) => {
  if (lat === undefined || lng === undefined) throw new ApiError(400, "lat and lng are required");
  const userLat = Number(lat);
  const userLng = Number(lng);
  const radius = Number(radiusKm);
  const degrees = radius / 111; // rough box so we don't compute distance for every row

  const where = {
    isActive: true,
    latitude: { [Op.between]: [userLat - degrees, userLat + degrees] },
    longitude: { [Op.between]: [userLng - degrees, userLng + degrees] },
  };
  if (type) where.type = type;

  const rows = await Facility.findAll({ where });
  return rows
    .map((f) => ({ ...f.toJSON(), distanceKm: distanceKm(userLat, userLng, f.latitude, f.longitude) }))
    .filter((f) => f.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);
};

// Admin
const createFacility = (data) => Facility.create(data);
const updateFacility = async (id, data) => {
  const f = await Facility.findByPk(id);
  if (!f) throw new ApiError(404, "Facility not found");
  return f.update(data);
};
const deleteFacility = async (id) => {
  const f = await Facility.findByPk(id);
  if (!f) throw new ApiError(404, "Facility not found");
  await f.destroy();
  return true;
};

// ---------- SOS ----------

// Press the button → we record it and hand back everything needed to act:
// contacts to call, the medical card, nearest hospitals/ambulance, hotlines
const triggerAlert = async (user, { type = "sos", latitude, longitude, address, message }) => {
  const alert = await EmergencyAlert.create({ userId: user.id, type, latitude, longitude, address, message });
  await notify(user.id, { title: "Emergency alert sent", body: "Stay calm. Call your primary contact or 112.", type: "emergency", data: { alertId: alert.id } });

  const [contacts, info, hotlines] = await Promise.all([getContacts(user.id), getInfo(user.id), getHotlines()]);
  const nearbyFacilities =
    latitude != null && longitude != null ? await getNearby({ lat: latitude, lng: longitude, radiusKm: 30 }) : [];

  return {
    alert,
    contacts,
    medicalInfo: info,
    hotlines,
    nearbyFacilities: nearbyFacilities.filter((f) => ["hospital", "clinic", "maternity_home", "ambulance"].includes(f.type)).slice(0, 5),
    mapsLink: latitude != null && longitude != null ? `https://www.google.com/maps?q=${latitude},${longitude}` : null,
  };
};

const getAlerts = (userId) => EmergencyAlert.findAll({ where: { userId }, order: [["createdAt", "DESC"]], limit: 20 });

const setAlertStatus = async (userId, id, status) => {
  const alert = await EmergencyAlert.findOne({ where: { id, userId } });
  if (!alert) throw new ApiError(404, "Alert not found");
  if (alert.status !== "active") throw new ApiError(400, "Alert is already closed");
  return alert.update({ status, resolvedAt: new Date() });
};

module.exports = {
  getContacts, createContact, updateContact, deleteContact,
  getInfo, updateInfo,
  getFacilities, getHotlines, getNearby, createFacility, updateFacility, deleteFacility,
  triggerAlert, getAlerts, setAlertStatus,
};