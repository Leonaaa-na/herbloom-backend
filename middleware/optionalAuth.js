const jwt = require("jsonwebtoken");
const { User } = require("../models");

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id);
    }
  } catch (error) {
    // bad token → just treat as logged out
  }
  next();
};

module.exports = optionalAuth;