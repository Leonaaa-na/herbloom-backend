const userRoutes = require("./user.route");
const cycleRoutes = require("./cycle.route");
const trackerRoutes = require("./tracker.route");
const partnerRoutes = require("./partner.route");
const pregnancyRoutes = require("./pregnancy.route");
const libraryRoutes = require("./library.route");
const professionalRoutes = require("./professional.route");
const chatRoutes = require("./chat.route");
const appointmentRoutes = require("./appointment.route");
const communityRoutes = require("./community.route");
const emergencyRoutes = require("./emergency.route");
const reminderRoutes = require("./reminder.route");
const notificationRoutes = require("./notification.route");
const paymentRoutes = require("./payment.route");

// API versioning: mount all routes under /api/v1
const mountVersioned = (app, prefix, routes) => {
  const v1 = `/api/v1${prefix}`;
  app.use(v1, routes);
};

module.exports = {
  userRoutes,
  cycleRoutes,
  trackerRoutes,
  partnerRoutes,
  pregnancyRoutes,
  libraryRoutes,
  professionalRoutes,
  chatRoutes,
  appointmentRoutes,
  communityRoutes,
  emergencyRoutes,
  reminderRoutes,
  notificationRoutes,
  paymentRoutes,
  mountVersioned,
};