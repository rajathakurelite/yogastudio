const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/AppError");
const { query, queryOne, withTransaction } = require("../db/pool");
const { audit } = require("../utils/helpers");
const classService = require("./class.service");
const logger = require("../utils/logger");

async function ensureTodaySession(classId, scheduleId = null) {
  const existing = await queryOne(
    "SELECT * FROM class_sessions WHERE class_id = ? AND session_date = CURDATE()",
    [classId]
  );
  if (existing) return existing;
  const result = await query(
    `INSERT INTO class_sessions (class_id, schedule_id, session_date, starts_at, status)
     VALUES (?, ?, CURDATE(), NOW(), 'open')`,
    [classId, scheduleId]
  );
  return queryOne("SELECT * FROM class_sessions WHERE id = ?", [result.insertId]);
}

async function getDailyYoga() {
  const scheduled = await queryOne(
    `SELECT sch.*, c.id AS class_id
     FROM class_schedules sch
     JOIN yoga_classes c ON c.id = sch.class_id
     WHERE c.status = 'published' AND DATE(sch.starts_at) = CURDATE()
     ORDER BY sch.starts_at ASC
     LIMIT 1`
  );
  let klass;
  if (scheduled) {
    klass = await classService.getClassById(scheduled.class_id);
  } else {
    klass = await queryOne(
      `SELECT c.*, s.name AS style_name, s.slug AS style_slug,
              g.name AS goal_name, g.slug AS goal_slug,
              (SELECT a.storage_url FROM class_media_assets a
                WHERE a.class_id = c.id AND a.asset_type = 'THUMBNAIL' AND a.status = 'ready'
                ORDER BY a.id DESC LIMIT 1) AS thumbnail_url
       FROM yoga_classes c
       LEFT JOIN yoga_styles s ON s.id = c.style_id
       LEFT JOIN yoga_goals g ON g.id = c.goal_id
       WHERE c.status = 'published'
       ORDER BY c.is_daily DESC, c.published_at DESC
       LIMIT 1`
    );
  }
  if (!klass) return { today: null, next: null };
  const session = await ensureTodaySession(klass.id, scheduled?.id || null);
  const count = await queryOne(
    "SELECT COUNT(*) AS n FROM class_participants WHERE session_id = ?",
    [session.id]
  );
  const next = await queryOne(
    `SELECT sch.*, c.title, c.instructor_display_name, c.duration_minutes, c.level
     FROM class_schedules sch
     JOIN yoga_classes c ON c.id = sch.class_id
     WHERE c.status = 'published' AND sch.starts_at > NOW()
     ORDER BY sch.starts_at ASC
     LIMIT 1`
  );
  return {
    today: {
      ...classService.mapClass(klass),
      startTime: scheduled?.starts_at || session.starts_at,
      participantCount: Number(count.n || 0),
      sessionId: session.id,
    },
    next: next || null,
  };
}

async function joinClass(user, classId) {
  const klass = await classService.getClassById(classId);
  if (!klass || klass.status !== "published") {
    throw new AppError(StatusCodes.NOT_FOUND, "Class not found", "CLASS_NOT_FOUND");
  }
  const session = await ensureTodaySession(classId);
  return withTransaction(async (tx) => {
    const existing = await tx.queryOne(
      "SELECT * FROM class_participants WHERE student_user_id = ? AND class_id = ? AND session_id = ?",
      [user.id, classId, session.id]
    );
    if (existing) return existing;
    const result = await tx.query(
      `INSERT INTO class_participants (student_user_id, class_id, session_id, status)
       VALUES (?, ?, ?, 'JOINED')`,
      [user.id, classId, session.id]
    );
    await audit(user.id, "class.join", "class_participant", result.insertId, { classId });
    logger.info({ userId: user.id, classId, sessionId: session.id }, "class join");
    return tx.queryOne("SELECT * FROM class_participants WHERE id = ?", [result.insertId]);
  });
}

async function progressClass(user, classId, { status, completionPercentage, durationWatchedSeconds }) {
  const participant = await queryOne(
    `SELECT p.* FROM class_participants p
     JOIN class_sessions s ON s.id = p.session_id
     WHERE p.student_user_id = ? AND p.class_id = ? AND s.session_date = CURDATE()
     ORDER BY p.id DESC LIMIT 1`,
    [user.id, classId]
  );
  if (!participant) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Join the class before tracking progress.", "NOT_JOINED");
  }
  const nextStatus = status || participant.status;
  const startedAt =
    nextStatus === "STARTED" && !participant.started_at ? new Date() : participant.started_at;
  const completedAt = nextStatus === "COMPLETED" ? new Date() : participant.completed_at;
  await query(
    `UPDATE class_participants
     SET status = ?, completion_percentage = ?, duration_watched_seconds = ?, started_at = ?, completed_at = ?
     WHERE id = ? AND student_user_id = ?`,
    [
      nextStatus,
      completionPercentage ?? participant.completion_percentage,
      durationWatchedSeconds ?? participant.duration_watched_seconds,
      startedAt,
      completedAt,
      participant.id,
      user.id,
    ]
  );
  if (nextStatus === "COMPLETED") {
    await query(
      `INSERT INTO student_class_history (student_user_id, class_id, participant_id, completed_at, duration_seconds)
       VALUES (?, ?, ?, NOW(), ?)`,
      [user.id, classId, participant.id, durationWatchedSeconds || 0]
    );
    logger.info({ userId: user.id, classId }, "class completion");
    await audit(user.id, "class.complete", "class_participant", participant.id, { classId });
  }
  return queryOne("SELECT * FROM class_participants WHERE id = ?", [participant.id]);
}

async function completeClass(user, classId, { durationWatchedSeconds, feedback, rating }) {
  const participant = await progressClass(user, classId, {
    status: "COMPLETED",
    completionPercentage: 100,
    durationWatchedSeconds,
  });
  if (feedback || rating) {
    await query(
      "UPDATE class_participants SET feedback = ?, rating = ? WHERE id = ? AND student_user_id = ?",
      [feedback || null, rating || null, participant.id, user.id]
    );
  }
  return queryOne("SELECT * FROM class_participants WHERE id = ?", [participant.id]);
}

async function studentHistory(userId) {
  return query(
    `SELECT h.*, c.title, c.instructor_display_name, c.duration_minutes, c.level,
            s.name AS style_name, g.name AS goal_name
     FROM student_class_history h
     JOIN yoga_classes c ON c.id = h.class_id
     LEFT JOIN yoga_styles s ON s.id = c.style_id
     LEFT JOIN yoga_goals g ON g.id = c.goal_id
     WHERE h.student_user_id = ?
     ORDER BY h.completed_at DESC`,
    [userId]
  );
}

async function studentDashboard(userId) {
  const daily = await getDailyYoga();
  const continueWatching = await queryOne(
    `SELECT p.*, c.title, c.instructor_display_name, c.duration_minutes
     FROM class_participants p
     JOIN yoga_classes c ON c.id = p.class_id
     WHERE p.student_user_id = ? AND p.status IN ('JOINED', 'STARTED')
     ORDER BY p.joined_at DESC LIMIT 1`,
    [userId]
  );
  const completed = await query(
    `SELECT h.*, c.title, c.instructor_display_name, c.duration_minutes
     FROM student_class_history h
     JOIN yoga_classes c ON c.id = h.class_id
     WHERE h.student_user_id = ?
     ORDER BY h.completed_at DESC LIMIT 6`,
    [userId]
  );
  const popular = await query(
    `SELECT c.*, s.name AS style_name, g.name AS goal_name,
            COUNT(p.id) AS joins
     FROM yoga_classes c
     LEFT JOIN class_participants p ON p.class_id = c.id
     LEFT JOIN yoga_styles s ON s.id = c.style_id
     LEFT JOIN yoga_goals g ON g.id = c.goal_id
     WHERE c.status = 'published'
     GROUP BY c.id
     ORDER BY joins DESC, c.published_at DESC
     LIMIT 8`
  );
  const recommended = await query(
    `SELECT c.*, s.name AS style_name, g.name AS goal_name
     FROM yoga_classes c
     LEFT JOIN yoga_styles s ON s.id = c.style_id
     LEFT JOIN yoga_goals g ON g.id = c.goal_id
     WHERE c.status = 'published'
     ORDER BY c.is_daily DESC, c.published_at DESC
     LIMIT 8`
  );
  const byGoal = await query(
    `SELECT g.id, g.slug, g.name, COUNT(c.id) AS class_count
     FROM yoga_goals g
     LEFT JOIN yoga_classes c ON c.goal_id = g.id AND c.status = 'published'
     WHERE g.is_active = 1
     GROUP BY g.id`
  );
  return {
    daily,
    continueWatching,
    recentlyCompleted: completed,
    popular: popular.map(classService.mapClass),
    recommended: recommended.map(classService.mapClass),
    byGoal,
  };
}

async function scheduleClass(user, classId, body) {
  const klass = await classService.getClassById(classId);
  await classService.assertClassAccess(klass, user, { mutate: true });
  if (klass.status !== "published" && !user.roles.includes("admin")) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Publish the class before scheduling it.",
      "NOT_PUBLISHED"
    );
  }
  const result = await query(
    `INSERT INTO class_schedules
      (class_id, instructor_user_id, starts_at, duration_minutes, visibility, max_participants)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      classId,
      klass.instructor_user_id,
      body.startsAt,
      body.durationMinutes || klass.duration_minutes,
      body.visibility || "public",
      body.maxParticipants || null,
    ]
  );
  await audit(user.id, "class.schedule", "class_schedule", result.insertId, { classId });
  return queryOne("SELECT * FROM class_schedules WHERE id = ?", [result.insertId]);
}

async function listSchedule({ from, to } = {}) {
  const rows = await query(
    `SELECT sch.*, c.title, c.level, c.language, c.instructor_display_name, c.duration_minutes AS class_duration,
            s.name AS style_name, g.name AS goal_name
     FROM class_schedules sch
     JOIN yoga_classes c ON c.id = sch.class_id
     LEFT JOIN yoga_styles s ON s.id = c.style_id
     LEFT JOIN yoga_goals g ON g.id = c.goal_id
     WHERE c.status = 'published'
       AND sch.starts_at >= ?
       AND sch.starts_at < ?
     ORDER BY sch.starts_at ASC`,
    [from || new Date(), to || new Date(Date.now() + 14 * 86400000)]
  );
  return rows;
}

async function classParticipation(user, classId) {
  const klass = await classService.getClassById(classId);
  await classService.assertClassAccess(klass, user, { mutate: true });
  return query(
    `SELECT p.*, u.full_name, u.email
     FROM class_participants p
     JOIN users u ON u.id = p.student_user_id
     WHERE p.class_id = ?
     ORDER BY p.joined_at DESC`,
    [classId]
  );
}

module.exports = {
  getDailyYoga,
  joinClass,
  progressClass,
  completeClass,
  studentHistory,
  studentDashboard,
  scheduleClass,
  listSchedule,
  classParticipation,
  ensureTodaySession,
};
