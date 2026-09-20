// METHOD | URL | STATUS | TIME | TIMESTAMP
const logger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  res.on("finish", () => {
    const level = res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARN" : "INFO";
    console.log(`[${timestamp}] [${level}] ${req.method} | ${req.originalUrl} | ${res.statusCode} | ${Date.now() - start}ms`);
  });
  next();
};

module.exports = logger;