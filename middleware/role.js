// Usage:  role("admin")   or   role("admin", "professional")
const role = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "You don't have permission to do this" });
  }
  next();
};

module.exports = role;