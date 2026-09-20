const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/AppError");
const { query, queryOne } = require("../db/pool");
const { audit } = require("../utils/helpers");

async function listStyles() {
  return query("SELECT * FROM yoga_styles WHERE is_active = 1 ORDER BY name");
}
async function listGoals() {
  return query("SELECT * FROM yoga_goals WHERE is_active = 1 ORDER BY name");
}
async function listPoses({ q, category, difficulty } = {}) {
  const where = ["is_active = 1"];
  const params = [];
  if (q) {
    where.push("(name LIKE ? OR sanskrit_name LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    where.push("category = ?");
    params.push(category);
  }
  if (difficulty) {
    where.push("difficulty = ?");
    params.push(difficulty);
  }
  return query(
    `SELECT * FROM yoga_poses WHERE ${where.join(" AND ")} ORDER BY name`,
    params
  );
}
async function createPose(user, body) {
  const result = await query(
    `INSERT INTO yoga_poses
      (slug, name, sanskrit_name, category, difficulty, description, instructions, breathing_guidance, caution_notes, image_url, video_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      body.slug || String(body.name).toLowerCase().replace(/\s+/g, "-"),
      body.name,
      body.sanskritName || null,
      body.category,
      body.difficulty || "beginner",
      body.description || null,
      body.instructions || null,
      body.breathingGuidance || null,
      body.cautionNotes || null,
      body.imageUrl || null,
      body.videoUrl || null,
    ]
  );
  await audit(user.id, "pose.create", "yoga_pose", result.insertId);
  return queryOne("SELECT * FROM yoga_poses WHERE id = ?", [result.insertId]);
}
async function updatePose(user, id, body) {
  const existing = await queryOne("SELECT * FROM yoga_poses WHERE id = ?", [id]);
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Pose not found", "POSE_NOT_FOUND");
  await query(
    `UPDATE yoga_poses SET name = ?, sanskrit_name = ?, category = ?, difficulty = ?,
      description = ?, instructions = ?, breathing_guidance = ?, caution_notes = ?,
      image_url = ?, video_url = ?, is_active = ?
     WHERE id = ?`,
    [
      body.name ?? existing.name,
      body.sanskritName ?? existing.sanskrit_name,
      body.category ?? existing.category,
      body.difficulty ?? existing.difficulty,
      body.description ?? existing.description,
      body.instructions ?? existing.instructions,
      body.breathingGuidance ?? existing.breathing_guidance,
      body.cautionNotes ?? existing.caution_notes,
      body.imageUrl ?? existing.image_url,
      body.videoUrl ?? existing.video_url,
      body.isActive == null ? existing.is_active : body.isActive ? 1 : 0,
      id,
    ]
  );
  await audit(user.id, "pose.update", "yoga_pose", id);
  return queryOne("SELECT * FROM yoga_poses WHERE id = ?", [id]);
}

async function upsertTaxonomy(table, user, body) {
  const result = await query(
    `INSERT INTO ${table} (slug, name, description, is_active) VALUES (?, ?, ?, 1)`,
    [body.slug, body.name, body.description || null]
  );
  await audit(user.id, `${table}.create`, table, result.insertId);
  return queryOne(`SELECT * FROM ${table} WHERE id = ?`, [result.insertId]);
}

async function listUsers(role) {
  const params = [];
  let sql = `SELECT u.id, u.email, u.full_name, u.is_active, u.created_at, GROUP_CONCAT(r.name) AS roles
             FROM users u
             LEFT JOIN user_roles ur ON ur.user_id = u.id
             LEFT JOIN roles r ON r.id = ur.role_id`;
  if (role) {
    sql += ` WHERE u.id IN (SELECT user_id FROM user_roles ur2 JOIN roles r2 ON r2.id = ur2.role_id WHERE r2.name = ?)`;
    params.push(role);
  }
  sql += " GROUP BY u.id ORDER BY u.created_at DESC";
  return query(sql, params);
}

async function setUserActive(admin, userId, isActive) {
  await query("UPDATE users SET is_active = ? WHERE id = ?", [isActive ? 1 : 0, userId]);
  await audit(admin.id, isActive ? "user.enable" : "user.disable", "user", userId);
}

async function platformAnalytics() {
  const classes = await queryOne(
    `SELECT COUNT(*) AS created,
            SUM(status = 'published') AS published
     FROM yoga_classes`
  );
  const completions = await queryOne(
    "SELECT COUNT(*) AS completed FROM class_participants WHERE status = 'COMPLETED'"
  );
  const students = await queryOne(
    `SELECT COUNT(DISTINCT u.id) AS active_students
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE r.name = 'student' AND u.is_active = 1`
  );
  const instructors = await queryOne(
    `SELECT COUNT(*) AS instructors FROM instructor_profiles WHERE is_active = 1`
  );
  const jobs = await queryOne(
    `SELECT
       SUM(status = 'COMPLETED') AS succeeded,
       SUM(status = 'FAILED') AS failed,
       AVG(TIMESTAMPDIFF(SECOND, created_at, completed_at)) AS avg_seconds
     FROM generation_jobs
     WHERE completed_at IS NOT NULL`
  );
  return {
    classesCreated: Number(classes.created || 0),
    classesPublished: Number(classes.published || 0),
    classesCompleted: Number(completions.completed || 0),
    activeStudents: Number(students.active_students || 0),
    instructors: Number(instructors.instructors || 0),
    generationSucceeded: Number(jobs.succeeded || 0),
    generationFailed: Number(jobs.failed || 0),
    avgGenerationSeconds: jobs.avg_seconds ? Number(jobs.avg_seconds) : null,
  };
}

async function listGenerationJobs({ status, provider } = {}) {
  const where = ["1=1"];
  const params = [];
  if (status) {
    where.push("status = ?");
    params.push(status);
  }
  if (provider) {
    where.push("provider = ?");
    params.push(provider);
  }
  return query(
    `SELECT j.*, c.title AS class_title, u.email AS user_email
     FROM generation_jobs j
     JOIN yoga_classes c ON c.id = j.class_id
     JOIN users u ON u.id = j.user_id
     WHERE ${where.join(" AND ")}
     ORDER BY j.id DESC
     LIMIT 200`,
    params
  );
}

async function listNotifications(userId) {
  return query(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50",
    [userId]
  );
}
async function markNotificationRead(userId, id) {
  await query("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [
    id,
    userId,
  ]);
}

async function createStyle(user, body) {
  return upsertTaxonomy("yoga_styles", user, body);
}
async function createGoal(user, body) {
  return upsertTaxonomy("yoga_goals", user, body);
}

module.exports = {
  listStyles,
  listGoals,
  listPoses,
  createPose,
  updatePose,
  listUsers,
  setUserActive,
  platformAnalytics,
  listGenerationJobs,
  listNotifications,
  markNotificationRead,
  createStyle,
  createGoal,
};
