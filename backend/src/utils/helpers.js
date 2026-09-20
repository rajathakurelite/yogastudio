const { validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/AppError");
const { query } = require("../db/pool");
const logger = require("../utils/logger");

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return next(
    new AppError(
      StatusCodes.BAD_REQUEST,
      "Please check the highlighted fields.",
      "VALIDATION_ERROR",
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    )
  );
}

async function audit(userId, action, entityType, entityId, metadata, req) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata_json, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        action,
        entityType,
        entityId || null,
        metadata ? JSON.stringify(metadata) : null,
        req?.ip || null,
      ]
    );
  } catch (err) {
    logger.error({ err: err.message, action }, "audit log failed");
  }
}

async function notify(userId, type, title, body, entityType, entityId) {
  await query(
    `INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, type, title, body || null, entityType || null, entityId || null]
  );
}

const DURATIONS = [15, 30, 45, 60];
const LEVELS = ["beginner", "intermediate", "advanced"];
const LANGUAGES = ["en", "hi"];
const CLASS_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "published",
  "rejected",
  "archived",
];
const ASSET_TYPES = [
  "CLASS_PLAN",
  "SCRIPT",
  "POSE_IMAGE",
  "INSTRUCTOR_IMAGE",
  "VIDEO",
  "VOICE",
  "MUSIC",
  "THUMBNAIL",
  "SOCIAL_VIDEO",
];
const JOB_STATUSES = ["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"];
const PARTICIPANT_STATUSES = ["JOINED", "STARTED", "COMPLETED", "ABANDONED"];

function parseJson(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractJson(text) {
  if (!text) throw new Error("Empty model response");
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model response was not valid JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

module.exports = {
  validate,
  audit,
  notify,
  DURATIONS,
  LEVELS,
  LANGUAGES,
  CLASS_STATUSES,
  ASSET_TYPES,
  JOB_STATUSES,
  PARTICIPANT_STATUSES,
  parseJson,
  extractJson,
};
