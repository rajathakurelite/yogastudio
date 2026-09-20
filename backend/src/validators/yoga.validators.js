const { body, param, query } = require("express-validator");
const { DURATIONS, LEVELS, LANGUAGES, ASSET_TYPES } = require("../utils/helpers");

const register = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("fullName").trim().isLength({ min: 2, max: 120 }),
  body("role").optional().isIn(["student", "instructor"]),
];

const login = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 1 }),
];

const createClass = [
  body("durationMinutes").isIn(DURATIONS),
  body("level").isIn(LEVELS),
  body("styleId").isInt({ min: 1 }),
  body("goalId").isInt({ min: 1 }),
  body("language").optional().isIn(LANGUAGES),
  body("instructorName").optional().isLength({ min: 2, max: 120 }),
  body("title").optional().isLength({ max: 255 }),
];

const generate = [
  param("id").isInt({ min: 1 }),
  body("assetType").isIn(ASSET_TYPES),
];

const schedule = [
  body("startsAt").isISO8601(),
  body("durationMinutes").optional().isIn(DURATIONS),
  body("visibility").optional().isIn(["public", "unlisted"]),
  body("maxParticipants").optional().isInt({ min: 1, max: 10000 }),
];

const idParam = [param("id").isInt({ min: 1 })];

const listClasses = [
  query("page").optional().isInt({ min: 1 }),
  query("pageSize").optional().isInt({ min: 1, max: 50 }),
  query("duration").optional().isIn(DURATIONS.map(String).concat(DURATIONS)),
  query("level").optional().isIn(LEVELS),
  query("language").optional().isIn(LANGUAGES),
];

module.exports = { register, login, createClass, generate, schedule, idParam, listClasses };
