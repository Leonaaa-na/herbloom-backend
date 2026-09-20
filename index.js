require("dotenv").config();
const compression = require("compression");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("./config/db");
const logger = require("./middleware/logger");
const maintenance = require("./middleware/maintenance");
const { notFound, errorHandler } = require("./middleware/error");
const allRoutes = require("./routes");
const scheduler = require("./jobs/scheduler");

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Global middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(compression());
app.use(express.json({ limit: "100kb", verify: (req, res, buf) => { req.rawBody = buf; } })); // rawBody needed for the Paystack webhook
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(logger);
app.use(maintenance);

// Rate limiting — generous default, stricter on auth endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use(generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later" },
});

// Health check
app.get("/", (req, res) => {
  res.send("HerBloom Backend is running!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/v1/users", (req, res, next) => {
  if (["/login", "/register", "/forgot-password", "/reset-password"].includes(req.path)) {
    return authLimiter(req, res, next);
  }
  next();
}, allRoutes.userRoutes);
app.use("/api/v1/cycles", allRoutes.cycleRoutes);
app.use("/api/v1/trackers", allRoutes.trackerRoutes);
app.use("/api/v1/partner", allRoutes.partnerRoutes);
app.use("/api/v1/pregnancy", allRoutes.pregnancyRoutes);
app.use("/api/v1/library", allRoutes.libraryRoutes);
app.use("/api/v1/professionals", allRoutes.professionalRoutes);
app.use("/api/v1/chat", allRoutes.chatRoutes);
app.use("/api/v1/appointments", allRoutes.appointmentRoutes);
app.use("/api/v1/community", allRoutes.communityRoutes);
app.use("/api/v1/emergency", allRoutes.emergencyRoutes);
app.use("/api/v1/reminders", allRoutes.reminderRoutes);
app.use("/api/v1/notifications", allRoutes.notificationRoutes);
app.use("/api/v1/payments", allRoutes.paymentRoutes);

// Must stay last
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`HerBloom Backend running on port ${PORT}`);
});

const startServer = async () => {
  await connectDB();
  scheduler.start();
};

startServer();

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} received: shutting down gracefully`);
  server.close(async () => {
    try {
      const { sequelize } = require("./config/db");
      await sequelize.close();
    } catch (e) {}
    console.log("Process terminated");
    process.exit(0);
  });
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));