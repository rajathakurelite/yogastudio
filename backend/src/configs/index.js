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

/** Docker --env-file keeps quotes; dotenv strips them. Normalize both. */
function envValue(name, fallback) {
  let value = process.env[name];
  if (value === undefined || value === "") return fallback;
  value = String(value).trim();
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

const configs = {
  env: process.env.NODE_ENV || "development",
  port: Number(envValue("API_PORT", "2005")),
  appName: envValue("APP_NAME", "Yoga Studio"),
  appUrl: envValue("APP_URL", "http://yogastudio.airepro.in:2004"),
  frontendOrigin: envValue(
    "FRONTEND_ORIGIN",
    "http://yogastudio.airepro.in:2004"
  ),
  jwtSecret: required(
    "JWT_SECRET_KEY",
    "dev-only-change-me-32-characters-min"
  ),
  jwtTimeout: envValue("JWT_TIMEOUT", "30d"),
  bcryptRounds: Number(envValue("BCRYPT_ROUNDS", "10")),
  db: {
    host: envValue("DATABASE_HOST", "127.0.0.1"),
    port: Number(envValue("DATABASE_PORT", "3307")),
    user: envValue("DATABASE_USERNAME", "yoga"),
    password: envValue("DATABASE_PASSWORD", "yoga"),
    database: envValue("DATABASE_NAME", "yoga_studio"),
  },
  media: {
    dir: path.resolve(
      __dirname,
      "../../",
      envValue("MEDIA_STORAGE_DIR", "./storage/media")
    ),
    publicBase: envValue(
      "MEDIA_PUBLIC_BASE_URL",
      "http://yogastudio-s.airepro.in:2005/media"
    ),
  },
  fable: {
    apiKey: envValue("ANTHROPIC_API_KEY", "") || envValue("FABLE_API_KEY", ""),
    baseUrl: envValue("FABLE_API_BASE_URL", "https://api.anthropic.com"),
    model: envValue("FABLE_MODEL", "claude-fable-5-1"),
    anthropicVersion: envValue("FABLE_ANTHROPIC_VERSION", "2023-06-01"),
    effort: envValue("FABLE_EFFORT", "medium"),
    maxTokens: Number(envValue("FABLE_MAX_TOKENS", "8192")),
    fallbackModel: envValue("FABLE_FALLBACK_MODEL", ""),
  },
  jobs: {
    pollMs: Number(envValue("GENERATION_POLL_MS", "1500")),
    maxRetries: Number(envValue("GENERATION_MAX_RETRIES", "3")),
  },
  rateLimit: {
    generationMax: Number(envValue("GENERATION_RATE_LIMIT_MAX", "10")),
    authMax: Number(envValue("AUTH_RATE_LIMIT_MAX", "30")),
  },
  logLevel: envValue("LOG_LEVEL", "info"),
};

module.exports = configs;
