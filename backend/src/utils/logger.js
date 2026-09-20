const winston = require("winston");
const configs = require("../configs");

const redact = winston.format((info) => {
  const text = JSON.stringify(info);
  const scrubbed = text
    .replace(/("?(api[_-]?key|password|token|authorization|secret)"?\s*[:=]\s*")[^"]+"/gi, '$1[REDACTED]"')
    .replace(/x-api-key["']?\s*[:=]\s*["'][^"']+/gi, "x-api-key:[REDACTED]");
  return JSON.parse(scrubbed);
});

const logger = winston.createLogger({
  level: configs.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    redact(),
    winston.format.json()
  ),
  defaultMeta: { service: "yoga-studio-api" },
  transports: [new winston.transports.Console()],
});

module.exports = logger;
