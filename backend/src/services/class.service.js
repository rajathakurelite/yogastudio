const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/AppError");
const { query, queryOne, withTransaction } = require("../db/pool");
const { audit, parseJson, notify } = require("../utils/helpers");
const logger = require("../utils/logger");

function mapClass(row) {
  if (!row) return null;
  return {
    id: row.id,
    instructorUserId: row.instructor_user_id,
    instructorName: row.instructor_display_name,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    level: row.level,
    styleId: row.style_id,
    styleName: row.style_name,
    styleSlug: row.style_slug,
    goalId: row.goal_id,
    goalName: row.goal_name,
    goalSlug: row.goal_slug,
    language: row.language,
    status: row.status,
    isDaily: Boolean(row.is_daily),
    plan: parseJson(row.plan_json),
    script: parseJson(row.script_json),
    scriptManuallyEdited: Boolean(row.script_manually_edited),
    objectives: row.objectives,
    safetyGuidance: row.safety_guidance,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    thumbnailUrl: row.thumbnail_url || null,
    participantCount: row.participant_count != null ? Number(row.participant_count) : undefined,
  };
}

const CLASS_SELECT = `
  SELECT c.*, s.name AS style_name, s.slug AS style_slug,
         g.name AS goal_name, g.slug AS goal_slug,
         (SELECT a.storage_url FROM class_media_assets a
           WHERE a.class_id = c.id AND a.asset_type = 'THUMBNAIL' AND a.status = 'ready'
           ORDER BY a.id DESC LIMIT 1) AS thumbnail_url
  FROM yoga_classes c
  LEFT JOIN yoga_styles s ON s.id = c.style_id
  LEFT JOIN yoga_goals g ON g.id = c.goal_id
`;

async function assertClassAccess(classRow, user, { mutate = false } = {}) {
  if (!classRow) {
    throw new AppError(StatusCodes.NOT_FOUND, "Class not found", "CLASS_NOT_FOUND");
  }
  const roles = user.roles || [];
  if (roles.includes("admin")) return;
  if (mutate) {
    if (!roles.includes("instructor") || classRow.instructor_user_id !== user.id) {
      throw new AppError(StatusCodes.FORBIDDEN, "You cannot change this class", "FORBIDDEN");
    }
  } else if (classRow.status !== "published") {
    if (!roles.includes("instructor") || classRow.instructor_user_id !== user.id) {
      throw new AppError(StatusCodes.FORBIDDEN, "This class is not available", "FORBIDDEN");
    }
  }
}

async function getClassById(id) {
  return queryOne(`${CLASS_SELECT} WHERE c.id = ?`, [id]);
}

async function listCatalog({
  q,
  duration,
  level,
  styleId,
  goalId,
  instructorId,
  language,
  status = "published",
  page = 1,
  pageSize = 12,
}) {
  const where = ["1=1"];
  const params = [];
  if (status) {
    where.push("c.status = ?");
    params.push(status);
  }
  if (q) {
    where.push("(c.title LIKE ? OR c.description LIKE ? OR c.instructor_display_name LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (duration) {
    where.push("c.duration_minutes = ?");
    params.push(Number(duration));
  }
  if (level) {
    where.push("c.level = ?");
    params.push(level);
  }
  if (styleId) {
    where.push("c.style_id = ?");
    params.push(Number(styleId));
  }
  if (goalId) {
    where.push("c.goal_id = ?");
    params.push(Number(goalId));
  }
  if (instructorId) {
    where.push("c.instructor_user_id = ?");
    params.push(Number(instructorId));
  }
  if (language) {
    where.push("c.language = ?");
    params.push(language);
  }
  const whereSql = where.join(" AND ");
  const count = await queryOne(
    `SELECT COUNT(*) AS total FROM yoga_classes c WHERE ${whereSql}`,
    params
  );
  const limit = Math.max(1, Number(pageSize) || 12);
  const offset = (Math.max(1, Number(page) || 1) - 1) * limit;
  const rows = await query(
    `${CLASS_SELECT} WHERE ${whereSql} ORDER BY c.published_at DESC, c.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  return {
    items: rows.map(mapClass),
    total: Number(count.total),
    page: Number(page),
    pageSize: Number(pageSize),
  };
}

async function createClass(user, body) {
  const instructorName = body.instructorName || user.fullName;
  const result = await query(
    `INSERT INTO yoga_classes
      (instructor_user_id, instructor_display_name, title, duration_minutes, level, style_id, goal_id, language, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    [
      user.id,
      instructorName,
      body.title || null,
      body.durationMinutes,
      body.level,
      body.styleId,
      body.goalId,
      body.language || "en",
    ]
  );
  await audit(user.id, "class.create", "yoga_class", result.insertId, {
    durationMinutes: body.durationMinutes,
    level: body.level,
  });
  return mapClass(await getClassById(result.insertId));
}

async function updateClass(user, id, body) {
  const existing = await getClassById(id);
  await assertClassAccess(existing, user, { mutate: true });
  if (["published"].includes(existing.status) && !user.roles.includes("admin")) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Unpublish the class before editing core details.",
      "CLASS_LOCKED"
    );
  }
  await query(
    `UPDATE yoga_classes SET
      instructor_display_name = ?,
      title = ?,
      description = ?,
      duration_minutes = ?,
      level = ?,
      style_id = ?,
      goal_id = ?,
      language = ?
     WHERE id = ?`,
    [
      body.instructorName ?? existing.instructor_display_name,
      body.title ?? existing.title,
      body.description ?? existing.description,
      body.durationMinutes ?? existing.duration_minutes,
      body.level ?? existing.level,
      body.styleId ?? existing.style_id,
      body.goalId ?? existing.goal_id,
      body.language ?? existing.language,
      id,
    ]
  );
  await audit(user.id, "class.update", "yoga_class", id);
  return mapClass(await getClassById(id));
}

async function deleteClass(user, id) {
  const existing = await getClassById(id);
  await assertClassAccess(existing, user, { mutate: true });
  await query("DELETE FROM yoga_classes WHERE id = ?", [id]);
  await audit(user.id, "class.delete", "yoga_class", id);
}

async function listSequence(classId) {
  const sequence = await queryOne(
    "SELECT * FROM yoga_class_sequences WHERE class_id = ? ORDER BY version DESC LIMIT 1",
    [classId]
  );
  if (!sequence) return { sequence: null, items: [] };
  const items = await query(
    `SELECT i.*, p.image_url AS pose_image_url, p.category AS pose_category
     FROM yoga_class_sequence_items i
     LEFT JOIN yoga_poses p ON p.id = i.pose_id
     WHERE i.sequence_id = ?
     ORDER BY i.sort_order ASC`,
    [sequence.id]
  );
  return { sequence, items };
}

async function replaceSequence(user, classId, items) {
  const existing = await getClassById(classId);
  await assertClassAccess(existing, user, { mutate: true });
  return withTransaction(async (tx) => {
    const prev = await tx.queryOne(
      "SELECT id, version FROM yoga_class_sequences WHERE class_id = ? ORDER BY version DESC LIMIT 1",
      [classId]
    );
    const version = prev ? prev.version + 1 : 1;
    const seq = await tx.query(
      "INSERT INTO yoga_class_sequences (class_id, version, generated_by) VALUES (?, ?, ?)",
      [classId, version, "instructor"]
    );
    const sequenceId = seq.insertId;
    let order = 1;
    for (const item of items) {
      await tx.query(
        `INSERT INTO yoga_class_sequence_items
          (sequence_id, pose_id, sort_order, item_type, name, sanskrit_name, duration_seconds,
           instructions, breathing_guidance, transition, instructor_note, scene_label, manually_edited)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          sequenceId,
          item.poseId || null,
          order++,
          item.itemType || "pose",
          item.name,
          item.sanskritName || null,
          item.durationSeconds || 60,
          item.instructions || null,
          item.breathingGuidance || null,
          item.transition || null,
          item.instructorNote || null,
          item.sceneLabel || null,
        ]
      );
    }
    return listSequence(classId);
  });
}

async function updateSequenceItem(user, classId, itemId, body) {
  const existing = await getClassById(classId);
  await assertClassAccess(existing, user, { mutate: true });
  const item = await queryOne(
    `SELECT i.* FROM yoga_class_sequence_items i
     JOIN yoga_class_sequences s ON s.id = i.sequence_id
     WHERE i.id = ? AND s.class_id = ?`,
    [itemId, classId]
  );
  if (!item) throw new AppError(StatusCodes.NOT_FOUND, "Sequence item not found", "ITEM_NOT_FOUND");
  await query(
    `UPDATE yoga_class_sequence_items SET
      name = ?, sanskrit_name = ?, duration_seconds = ?, instructions = ?,
      breathing_guidance = ?, transition = ?, instructor_note = ?, item_type = ?,
      pose_id = ?, manually_edited = 1
     WHERE id = ?`,
    [
      body.name ?? item.name,
      body.sanskritName ?? item.sanskrit_name,
      body.durationSeconds ?? item.duration_seconds,
      body.instructions ?? item.instructions,
      body.breathingGuidance ?? item.breathing_guidance,
      body.transition ?? item.transition,
      body.instructorNote ?? item.instructor_note,
      body.itemType ?? item.item_type,
      body.poseId ?? item.pose_id,
      itemId,
    ]
  );
  return queryOne("SELECT * FROM yoga_class_sequence_items WHERE id = ?", [itemId]);
}

async function submitForReview(user, id) {
  const existing = await getClassById(id);
  await assertClassAccess(existing, user, { mutate: true });
  const { items } = await listSequence(id);
  if (!items.length) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Add a class sequence before submitting for review.",
      "SEQUENCE_REQUIRED"
    );
  }
  await query("UPDATE yoga_classes SET status = 'pending_review' WHERE id = ?", [id]);
  const admins = await query(
    `SELECT u.id FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE r.name = 'admin'`
  );
  for (const admin of admins) {
    await notify(
      admin.id,
      "class.review",
      "Class ready for review",
      `${existing.instructor_display_name} submitted "${existing.title || "Untitled class"}".`,
      "yoga_class",
      id
    );
  }
  await audit(user.id, "class.submit", "yoga_class", id);
  return mapClass(await getClassById(id));
}

async function moderateClass(admin, id, action, reason) {
  const existing = await getClassById(id);
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Class not found", "CLASS_NOT_FOUND");
  if (action === "approve") {
    await query(
      "UPDATE yoga_classes SET status = 'approved', approved_by = ?, rejected_reason = NULL WHERE id = ?",
      [admin.id, id]
    );
    await notify(
      existing.instructor_user_id,
      "class.approved",
      "Class approved",
      `"${existing.title || "Your class"}" was approved and can be published.`,
      "yoga_class",
      id
    );
  } else if (action === "reject") {
    await query(
      "UPDATE yoga_classes SET status = 'rejected', rejected_reason = ? WHERE id = ?",
      [reason || "Needs revision", id]
    );
    await notify(
      existing.instructor_user_id,
      "class.rejected",
      "Class needs changes",
      reason || "Please revise and resubmit.",
      "yoga_class",
      id
    );
  } else if (action === "publish") {
    if (!["approved", "published"].includes(existing.status) && !admin.roles.includes("admin")) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Approve the class before publishing.",
        "NOT_APPROVED"
      );
    }
    await query(
      "UPDATE yoga_classes SET status = 'published', published_at = NOW(), approved_by = COALESCE(approved_by, ?) WHERE id = ?",
      [admin.id, id]
    );
    await notify(
      existing.instructor_user_id,
      "class.published",
      "Class published",
      `"${existing.title || "Your class"}" is live.`,
      "yoga_class",
      id
    );
  } else if (action === "unpublish") {
    await query("UPDATE yoga_classes SET status = 'approved' WHERE id = ?", [id]);
  } else {
    throw new AppError(StatusCodes.BAD_REQUEST, "Unknown moderation action", "INVALID_ACTION");
  }
  await audit(admin.id, `class.${action}`, "yoga_class", id, { reason });
  logger.info({ classId: id, action, userId: admin.id }, "class moderated");
  return mapClass(await getClassById(id));
}

async function publishClass(user, id) {
  const existing = await getClassById(id);
  await assertClassAccess(existing, user, { mutate: true });
  if (existing.status !== "approved" && !user.roles.includes("admin")) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "An admin must approve this class before it can be published.",
      "NOT_APPROVED"
    );
  }
  return moderateClass(user, id, "publish");
}

async function instructorClasses(userId, status) {
  const params = [userId];
  let sql = `${CLASS_SELECT} WHERE c.instructor_user_id = ?`;
  if (status) {
    sql += " AND c.status = ?";
    params.push(status);
  }
  sql += " ORDER BY c.updated_at DESC";
  const rows = await query(sql, params);
  return rows.map(mapClass);
}

async function instructorAnalytics(userId) {
  const stats = await queryOne(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'published') AS published,
       SUM(status = 'draft') AS drafts,
       SUM(status = 'pending_review') AS pending
     FROM yoga_classes WHERE instructor_user_id = ?`,
    [userId]
  );
  const scheduled = await queryOne(
    `SELECT COUNT(*) AS scheduled FROM class_schedules sch
     JOIN yoga_classes c ON c.id = sch.class_id
     WHERE c.instructor_user_id = ? AND sch.starts_at >= NOW()`,
    [userId]
  );
  const students = await queryOne(
    `SELECT COUNT(DISTINCT p.student_user_id) AS students,
            SUM(p.status = 'COMPLETED') AS completions
     FROM class_participants p
     JOIN yoga_classes c ON c.id = p.class_id
     WHERE c.instructor_user_id = ?`,
    [userId]
  );
  return {
    totalClasses: Number(stats.total || 0),
    publishedClasses: Number(stats.published || 0),
    draftClasses: Number(stats.drafts || 0),
    pendingReview: Number(stats.pending || 0),
    scheduledClasses: Number(scheduled.scheduled || 0),
    students: Number(students.students || 0),
    totalCompletions: Number(students.completions || 0),
  };
}

async function applyGeneratedPlan(classId, plan, generatedBy = "fable") {
  return withTransaction(async (tx) => {
    const klass = await tx.queryOne("SELECT * FROM yoga_classes WHERE id = ?", [classId]);
    await tx.query(
      `UPDATE yoga_classes SET
        title = COALESCE(NULLIF(title, ''), ?),
        description = ?,
        objectives = ?,
        safety_guidance = ?,
        plan_json = ?
       WHERE id = ?`,
      [
        plan.title,
        plan.description || klass.description,
        Array.isArray(plan.objectives) ? plan.objectives.join("\n") : plan.objectives,
        plan.safetyGuidance || klass.safety_guidance,
        JSON.stringify(plan),
        classId,
      ]
    );
    const prev = await tx.queryOne(
      "SELECT version FROM yoga_class_sequences WHERE class_id = ? ORDER BY version DESC LIMIT 1",
      [classId]
    );
    const seq = await tx.query(
      "INSERT INTO yoga_class_sequences (class_id, version, generated_by) VALUES (?, ?, ?)",
      [classId, prev ? prev.version + 1 : 1, generatedBy]
    );
    let order = 1;
    for (const section of plan.sections) {
      let poseId = null;
      if (section.name) {
        const pose = await tx.queryOne(
          "SELECT id FROM yoga_poses WHERE name = ? OR slug = ? LIMIT 1",
          [section.name, String(section.name).toLowerCase().replace(/\s+/g, "-")]
        );
        poseId = pose?.id || null;
      }
      await tx.query(
        `INSERT INTO yoga_class_sequence_items
          (sequence_id, pose_id, sort_order, item_type, name, sanskrit_name, duration_seconds,
           instructions, breathing_guidance, transition, instructor_note, scene_label)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          seq.insertId,
          poseId,
          order++,
          section.itemType || "pose",
          section.name,
          section.sanskritName || null,
          Number(section.durationSeconds) || 60,
          section.instructions || null,
          section.breathingGuidance || null,
          section.transition || null,
          section.instructorNote || null,
          section.sceneLabel || null,
        ]
      );
    }
  });
}

module.exports = {
  mapClass,
  getClassById,
  assertClassAccess,
  listCatalog,
  createClass,
  updateClass,
  deleteClass,
  listSequence,
  replaceSequence,
  updateSequenceItem,
  submitForReview,
  moderateClass,
  publishClass,
  instructorClasses,
  instructorAnalytics,
  applyGeneratedPlan,
};
