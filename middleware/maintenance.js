// Set MAINTENANCE_MODE=true in .env to block everything except the health check
const maintenance = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === "true" && req.path !== "/") {
    return res.status(503).json({
      success: false,
      message: "HerBloom is under maintenance. Please try again later.",
    });
  }
  next();
};

module.exports = maintenance;