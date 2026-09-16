// Usage:  throw new ApiError(404, "Cycle not found");
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = ApiError;