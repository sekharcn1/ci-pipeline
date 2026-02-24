const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const Redis = require("ioredis");

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || "1.0.0";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Security and compression middleware
app.use(helmet());
app.use(compression());

// Redis client — skip during tests
let redis = null;
if (process.env.NODE_ENV !== "test") {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      return Math.min(times * 200, 2000);
    },
  });

  redis.on("connect", () => console.log("[INFO] Connected to Redis"));
  redis.on("error", (err) => console.error("[ERROR] Redis:", err.message));
}

// Health check — includes Redis status
app.get("/health", async (req, res) => {
  const health = { status: "healthy", version: VERSION, redis: "disconnected" };

  if (redis) {
    try {
      await redis.ping();
      health.redis = "connected";
    } catch {
      health.redis = "error";
      health.status = "degraded";
    }
  }

  res.status(health.status === "healthy" ? 200 : 503).json(health);
});

// Main endpoint — increments visit counter
app.get("/", async (req, res) => {
  let visits = null;
  if (redis) {
    try {
      visits = await redis.incr("visits");
    } catch (err) {
      console.error("[ERROR] Redis INCR failed:", err.message);
    }
  }

  const message = visits
    ? `Hello from CI Pipeline App v${VERSION}! Visits: ${visits}\n`
    : `Hello from CI Pipeline App v${VERSION}!\n`;
  res.send(message);
});

// Stats endpoint — current visit count
app.get("/stats", async (req, res) => {
  let visits = 0;
  if (redis) {
    try {
      visits = parseInt(await redis.get("visits"), 10) || 0;
    } catch (err) {
      console.error("[ERROR] Redis GET failed:", err.message);
    }
  }
  res.json({ visits });
});

// Only listen when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[INFO] App v${VERSION} running on port ${PORT}`);
  });
}

module.exports = app;
