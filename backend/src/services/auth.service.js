const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const configs = require("../configs");
const AppError = require("../utils/AppError");
const { query, queryOne, withTransaction } = require("../db/pool");
const { audit } = require("../utils/helpers");

async function getUserWithRoles(userId) {
  const user = await queryOne(
    `SELECT u.id, u.email, u.full_name, u.locale, u.is_active,
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
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    locale: user.locale,
    isActive: Boolean(user.is_active),
    phone: user.phone || null,
    instructorDisplayName: user.instructor_display_name || null,
    roles: (user.roles || "").split(",").filter(Boolean),
  };
}

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    configs.jwtSecret,
    { expiresIn: configs.jwtTimeout }
  );
}

async function register({ email, password, fullName, role = "student" }) {
  const allowed = ["student", "instructor"];
  if (!allowed.includes(role)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid role", "INVALID_ROLE");
  }
  const existing = await queryOne("SELECT id FROM users WHERE email = ?", [
    email.toLowerCase(),
  ]);
  if (existing) {
    throw new AppError(StatusCodes.CONFLICT, "An account with that email already exists", "EMAIL_TAKEN");
  }
  const passwordHash = await bcrypt.hash(password, configs.bcryptRounds);
  const userId = await withTransaction(async (tx) => {
    const result = await tx.query(
      "INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)",
      [email.toLowerCase(), passwordHash, fullName]
    );
    const roleRow = await tx.queryOne("SELECT id FROM roles WHERE name = ?", [role]);
    await tx.query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [
      result.insertId,
      roleRow.id,
    ]);
    if (role === "instructor") {
      await tx.query(
        "INSERT INTO instructor_profiles (user_id, display_name) VALUES (?, ?)",
        [result.insertId, fullName]
      );
    }
    return result.insertId;
  });
  const user = await getUserWithRoles(userId);
  await audit(userId, "register", "user", userId, { role });
  return { token: signToken(user), user };
}

async function login({ email, password }) {
  const row = await queryOne(
    "SELECT id, password_hash, is_active FROM users WHERE email = ?",
    [email.toLowerCase()]
  );
  if (!row) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password", "INVALID_CREDENTIALS");
  }
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password", "INVALID_CREDENTIALS");
  }
  if (!row.is_active) {
    throw new AppError(StatusCodes.FORBIDDEN, "Account is disabled", "ACCOUNT_DISABLED");
  }
  await query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [row.id]);
  const user = await getUserWithRoles(row.id);
  return { token: signToken(user), user };
}

async function updateProfile(userId, { fullName, locale, phone }) {
  await query("UPDATE users SET full_name = ?, locale = ? WHERE id = ?", [
    fullName,
    locale || "en",
    userId,
  ]);
  if (phone !== undefined) {
    const profile = await queryOne(
      "SELECT id FROM instructor_profiles WHERE user_id = ?",
      [userId]
    );
    if (profile) {
      await query("UPDATE instructor_profiles SET phone = ? WHERE user_id = ?", [
        phone || null,
        userId,
      ]);
    }
  }
  return getUserWithRoles(userId);
}

module.exports = { register, login, getUserWithRoles, updateProfile, signToken };
