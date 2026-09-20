const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const configs = require("../configs");
const AppError = require("../utils/AppError");
const { query } = require("../db/pool");

async function isAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

  if (!token) {
    return next(
      new AppError(StatusCodes.UNAUTHORIZED, "You are not authenticated", "AUTH_REQUIRED")
    );
  }

  try {
    const decoded = jwt.verify(token, configs.jwtSecret);
    const userId = decoded.userId || decoded.id;
    const rows = await query(
      `SELECT u.id, u.email, u.full_name, u.is_active, u.locale,
              ip.phone AS phone, ip.display_name AS instructor_display_name,
              GROUP_CONCAT(r.name) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN instructor_profiles ip ON ip.user_id = u.id
       WHERE u.id = ?
       GROUP BY u.id, ip.phone, ip.display_name`,
      [userId]
    );
    const user = rows[0];
    if (!user || !user.is_active) {
      return next(
        new AppError(StatusCodes.UNAUTHORIZED, "Authentication Failed", "AUTH_FAILED")
      );
    }
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      locale: user.locale,
      phone: user.phone || null,
      instructorDisplayName: user.instructor_display_name || null,
      roles: (user.roles || "").split(",").filter(Boolean),
    };
    return next();
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      return next(
        new AppError(StatusCodes.UNAUTHORIZED, "Authentication token expired", "AUTH_EXPIRED")
      );
    }
    return next(
      new AppError(StatusCodes.UNAUTHORIZED, "Authentication Failed", "AUTH_FAILED")
    );
  }
}

function requireRoles(...allowed) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (allowed.some((role) => roles.includes(role))) return next();
    return next(
      new AppError(StatusCodes.FORBIDDEN, "You do not have permission to do that", "FORBIDDEN")
    );
  };
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return next();
  return isAuth(req, res, next);
}

module.exports = { isAuth, requireRoles, optionalAuth };
