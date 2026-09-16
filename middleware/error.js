// Unknown route
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Every thrown error in the app ends up here
const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let errors;

  if (err.name === "SequelizeValidationError") {
    status = 400;
    message = "Validation failed";
    errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
  }
  if (err.name === "SequelizeUniqueConstraintError") {
    status = 409;
    message = "Already exists";
    errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
  }
  if (err.name === "SequelizeForeignKeyConstraintError") {
    status = 400;
    message = "Related record not found";
  }
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    status = 401;
    message = "Invalid or expired token";
  }

  if (status === 500) console.error(err); // only log real crashes

  res.status(status).json({ success: false, message, ...(errors && { errors }) });
};

module.exports = { notFound, errorHandler };