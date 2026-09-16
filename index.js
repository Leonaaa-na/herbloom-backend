require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const logger = require("./middleware/logger");
const maintenance = require("./middleware/maintenance");
const { notFound, errorHandler } = require("./middleware/error");
const allRoutes = require("./routes");
const scheduler = require("./jobs/scheduler");

const app = express();
const PORT = process.env.PORT || 5000;

// Global middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })); // rawBody needed for the Paystack webhook
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(maintenance);

// Health check
app.get("/", (req, res) => {
  res.send("HerBloom Backend is running!");
});

// Routes
app.use("/api/users", allRoutes.userRoutes);
app.use("/api/cycles", allRoutes.cycleRoutes);
app.use("/api/trackers", allRoutes.trackerRoutes);
app.use("/api/partner", allRoutes.partnerRoutes);
app.use("/api/pregnancy", allRoutes.pregnancyRoutes);
app.use("/api/library", allRoutes.libraryRoutes);
app.use("/api/professionals", allRoutes.professionalRoutes);
app.use("/api/chat", allRoutes.chatRoutes);
app.use("/api/appointments", allRoutes.appointmentRoutes);
app.use("/api/community", allRoutes.communityRoutes);
app.use("/api/emergency", allRoutes.emergencyRoutes);
app.use("/api/reminders", allRoutes.reminderRoutes);
app.use("/api/notifications", allRoutes.notificationRoutes);
app.use("/api/payments", allRoutes.paymentRoutes);

// Must stay last
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  scheduler.start();
  app.listen(PORT, () => {
    console.log(`HerBloom Backend running on port ${PORT}`);
  });
};

startServer();