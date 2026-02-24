const express = require("express");
const helmet = require("helmet");
const compression = require("compression");

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || "1.0.0";

// Security and compression middleware
app.use(helmet());
app.use(compression());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", version: VERSION });
});

// Main endpoint
app.get("/", (req, res) => {
  res.send(`Hello from CI Pipeline App v${VERSION}!\n`);
});

// Only start listening when run directly (not during tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[INFO] App v${VERSION} running on port ${PORT}`);
  });
}

module.exports = app;
