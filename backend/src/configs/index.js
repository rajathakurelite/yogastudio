const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../../.env"),
});
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
  override: false,
});

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const configs = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.API_PORT || 2005),
  appName: process.env.APP_NAME || "Yoga Studio",
  appUrl: process.env.APP_URL || "http://yogastudio.airepro.in:2004",
  frontendOrigin:
    process.env.FRONTEND_ORIGIN || "http://yogastudio.airepro.in:2004",
  jwtSecret: required("JWT_SECRET_KEY", "dev-only-change-me-32-characters-min"),
  jwtTimeout: process.env.JWT_TIMEOUT || "30d",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
  db: {
    host: process.env.DATABASE_HOST || "127.0.0.1",
    port: Number(process.env.DATABASE_PORT || 3307),
    user: process.env.DATABASE_USERNAME || "yoga",
    password: process.env.DATABASE_PASSWORD || "yoga",
    database: process.env.DATABASE_NAME || "yoga_studio",
  },
  media: {
    dir: path.resolve(
      __dirname,
      "../../",
      process.env.MEDIA_STORAGE_DIR || "./storage/media"
    ),
    publicBase:
      process.env.MEDIA_PUBLIC_BASE_URL ||
      "http://yogastudio-s.airepro.in:2005/media",
  },
  fable: {
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.FABLE_API_KEY || "",
    baseUrl: process.env.FABLE_API_BASE_URL || "https://api.anthropic.com",
    model: process.env.FABLE_MODEL || "claude-fable-5-1",
    anthropicVersion: process.env.FABLE_ANTHROPIC_VERSION || "2023-06-01",
    effort: process.env.FABLE_EFFORT || "medium",
    maxTokens: Number(process.env.FABLE_MAX_TOKENS || 8192),
    fallbackModel: process.env.FABLE_FALLBACK_MODEL || "",
  },
  jobs: {
    pollMs: Number(process.env.GENERATION_POLL_MS || 1500),
    maxRetries: Number(process.env.GENERATION_MAX_RETRIES || 3),
  },
  rateLimit: {
    generationMax: Number(process.env.GENERATION_RATE_LIMIT_MAX || 10),
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
  },
  logLevel: process.env.LOG_LEVEL || "info",
};

module.exports = configs;
