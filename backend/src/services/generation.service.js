const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/AppError");
const { query, queryOne } = require("../db/pool");
const logger = require("../utils/logger");
const { audit, parseJson, notify } = require("../utils/helpers");
const configs = require("../configs");
const classService = require("./class.service");
const {
  getMediaGenerationProvider,
  CapabilityUnavailableError,
  ProviderNotConfiguredError,
} = require("../providers/fableProvider");

function mapJob(row) {
  if (!row) return null;
  return {
    id: row.id,
    classId: row.class_id,
    userId: row.user_id,
    provider: row.provider,
    assetType: row.asset_type,
    status: row.status,
    progress: row.progress,
    retryCount: row.retry_count,
    providerJobId: row.provider_job_id,
    input: parseJson(row.input_json),
    output: parseJson(row.output_json),
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

async function enqueueJob(user, classId, assetType, input = {}, { force = false } = {}) {
  const klass = await classService.getClassById(classId);
  await classService.assertClassAccess(klass, user, { mutate: true });

  if (!force) {
    const duplicate = await queryOne(
      `SELECT id, status FROM generation_jobs
       WHERE class_id = ? AND asset_type = ? AND status IN ('QUEUED', 'PROCESSING', 'COMPLETED')
       ORDER BY id DESC LIMIT 1`,
      [classId, assetType]
    );
    if (duplicate && duplicate.status !== "COMPLETED") {
      return mapJob(await queryOne("SELECT * FROM generation_jobs WHERE id = ?", [duplicate.id]));
    }
    if (duplicate && duplicate.status === "COMPLETED" && !input.regenerate) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "This asset already exists. Confirm regenerate to create it again.",
        "DUPLICATE_GENERATION"
      );
    }
  }

  const provider = getMediaGenerationProvider(assetType);
  const result = await query(
    `INSERT INTO generation_jobs
      (class_id, user_id, provider, asset_type, status, progress, input_json)
     VALUES (?, ?, ?, ?, 'QUEUED', 0, ?)`,
    [classId, user.id, provider.name, assetType, JSON.stringify(input)]
  );
  logger.info(
    { jobId: result.insertId, classId, assetType, provider: provider.name, userId: user.id },
    "generation request"
  );
  await audit(user.id, "generation.enqueue", "generation_job", result.insertId, {
    assetType,
    classId,
  });
  return mapJob(await queryOne("SELECT * FROM generation_jobs WHERE id = ?", [result.insertId]));
}

async function listJobs(classId) {
  const rows = await query(
    "SELECT * FROM generation_jobs WHERE class_id = ? ORDER BY id DESC LIMIT 50",
    [classId]
  );
  return rows.map(mapJob);
}

async function getJob(id) {
  return mapJob(await queryOne("SELECT * FROM generation_jobs WHERE id = ?", [id]));
}

async function cancelJob(user, id) {
  const job = await queryOne("SELECT * FROM generation_jobs WHERE id = ?", [id]);
  if (!job) throw new AppError(StatusCodes.NOT_FOUND, "Job not found", "JOB_NOT_FOUND");
  const klass = await classService.getClassById(job.class_id);
  await classService.assertClassAccess(klass, user, { mutate: true });
  if (!["QUEUED", "PROCESSING"].includes(job.status)) {
    throw new AppError(StatusCodes.CONFLICT, "This job can no longer be cancelled", "JOB_NOT_CANCELLABLE");
  }
  await query(
    "UPDATE generation_jobs SET status = 'CANCELLED', error_message = 'Cancelled by user' WHERE id = ? AND status IN ('QUEUED', 'PROCESSING')",
    [id]
  );
  return getJob(id);
}

async function retryJob(user, id) {
  const job = await queryOne("SELECT * FROM generation_jobs WHERE id = ?", [id]);
  if (!job) throw new AppError(StatusCodes.NOT_FOUND, "Job not found", "JOB_NOT_FOUND");
  const klass = await classService.getClassById(job.class_id);
  await classService.assertClassAccess(klass, user, { mutate: true });
  if (job.retry_count >= configs.jobs.maxRetries) {
    throw new AppError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Retry limit reached for this generation.",
      "RETRY_LIMIT"
    );
  }
  await query(
    `UPDATE generation_jobs
     SET status = 'QUEUED', progress = 0, error_code = NULL, error_message = NULL, technical_error = NULL, retry_count = retry_count + 1
     WHERE id = ?`,
    [id]
  );
  logger.info({ jobId: id, retryCount: job.retry_count + 1 }, "generation retry");
  return getJob(id);
}

function publicError(err) {
  if (err instanceof ProviderNotConfiguredError) {
    return {
      code: err.code,
      message: "AI generation is not configured yet. An admin needs to add the Fable API key.",
      technical: err.message,
    };
  }
  if (err instanceof CapabilityUnavailableError) {
    return {
      code: err.code,
      message:
        err.assetType === "VIDEO" || err.assetType === "SOCIAL_VIDEO"
          ? "Video generation is not available through Fable 5's current API. We kept the button so it can be wired to a future provider."
          : err.assetType === "VOICE" || err.assetType === "MUSIC"
            ? "Voice and music generation are not available through Fable 5's current API."
            : err.message,
      technical: err.message,
    };
  }
  if (err.code === "FABLE_REFUSAL") {
    return {
      code: "FABLE_REFUSAL",
      message: "That generation was declined. Try a more general wellness description.",
      technical: err.message,
    };
  }
  return {
    code: "GENERATION_FAILED",
    message: "Your class content couldn't be generated. Please try again.",
    technical: err.message,
  };
}

async function processJob(job) {
  const claimed = await query(
    `UPDATE generation_jobs SET status = 'PROCESSING', progress = 10, updated_at = NOW()
     WHERE id = ? AND status = 'QUEUED'`,
    [job.id]
  );
  if (!claimed.affectedRows) return;

  try {
    const klass = await classService.getClassById(job.class_id);
    const { items } = await classService.listSequence(job.class_id);
    const input = { ...(parseJson(job.input_json) || {}), classId: job.class_id };
    input.instructorName = klass.instructor_display_name;
    input.title = klass.title;
    input.durationMinutes = klass.duration_minutes;
    input.level = klass.level;
    input.styleName = klass.style_name;
    input.goalName = klass.goal_name;
    input.language = klass.language;
    input.sequence = items.map((i) => ({
      id: i.id,
      name: i.name,
      sanskritName: i.sanskrit_name,
      durationSeconds: i.duration_seconds,
      instructions: i.instructions,
      breathingGuidance: i.breathing_guidance,
      transition: i.transition,
      instructorNote: i.instructor_note,
      itemType: i.item_type,
    }));
    const poses = await query(
      "SELECT name, sanskrit_name, slug FROM yoga_poses WHERE is_active = 1"
    );
    input.poseCatalog = poses.map((p) => p.name).join(", ");

    await query("UPDATE generation_jobs SET progress = 40 WHERE id = ?", [job.id]);
    const provider = getMediaGenerationProvider(job.asset_type);
    const result = await provider.generate(job.asset_type, input);
    await query("UPDATE generation_jobs SET progress = 80 WHERE id = ?", [job.id]);

    if (job.asset_type === "CLASS_PLAN") {
      await classService.applyGeneratedPlan(job.class_id, result.data, provider.name);
    } else if (job.asset_type === "SCRIPT") {
      const current = await queryOne(
        "SELECT script_manually_edited FROM yoga_classes WHERE id = ?",
        [job.class_id]
      );
      if (current.script_manually_edited && !input.overwriteManual) {
        throw new AppError(
          StatusCodes.CONFLICT,
          "This script was edited by the instructor. Confirm overwrite to regenerate.",
          "MANUAL_EDITS_PRESERVED"
        );
      }
      await query("UPDATE yoga_classes SET script_json = ?, script_manually_edited = 0 WHERE id = ?", [
        JSON.stringify(result.data),
        job.class_id,
      ]);
    } else if (result.kind === "file") {
      await query(
        `INSERT INTO class_media_assets
          (class_id, sequence_item_id, asset_type, provider, storage_url, status, metadata_json, created_by)
         VALUES (?, ?, ?, ?, ?, 'ready', ?, ?)`,
        [
          job.class_id,
          input.sequenceItemId || null,
          job.asset_type,
          provider.name,
          result.storageUrl,
          JSON.stringify(result.metadata || {}),
          job.user_id,
        ]
      );
    }

    await query(
      `UPDATE generation_jobs
       SET status = 'COMPLETED', progress = 100, output_json = ?, completed_at = NOW()
       WHERE id = ?`,
      [JSON.stringify(result.data || { storageUrl: result.storageUrl }), job.id]
    );
    logger.info({ jobId: job.id, assetType: job.asset_type }, "generation completed");
    await notify(
      job.user_id,
      "generation.completed",
      "Generation complete",
      `${job.asset_type.replace(/_/g, " ").toLowerCase()} is ready to preview.`,
      "generation_job",
      job.id
    );
  } catch (err) {
    const mapped = publicError(err);
    logger.error(
      {
        jobId: job.id,
        assetType: job.asset_type,
        code: mapped.code,
        err: mapped.technical,
      },
      "generation failure"
    );
    await query(
      `UPDATE generation_jobs
       SET status = 'FAILED', error_code = ?, error_message = ?, technical_error = ?, completed_at = NOW()
       WHERE id = ?`,
      [mapped.code, mapped.message, mapped.technical, job.id]
    );
    await notify(
      job.user_id,
      "generation.failed",
      "Generation failed",
      mapped.message,
      "generation_job",
      job.id
    );
  }
}

let timer;
function startJobRunner() {
  if (timer) return;
  timer = setInterval(async () => {
    try {
      const jobs = await query(
        "SELECT * FROM generation_jobs WHERE status = 'QUEUED' ORDER BY id ASC LIMIT 3"
      );
      for (const job of jobs) {
        await processJob(job);
      }
    } catch (err) {
      logger.error({ err: err.message }, "job runner tick failed");
    }
  }, configs.jobs.pollMs);
  if (timer.unref) timer.unref();
}

function stopJobRunner() {
  if (timer) clearInterval(timer);
  timer = null;
}

async function listAssets(classId) {
  const rows = await query(
    "SELECT * FROM class_media_assets WHERE class_id = ? ORDER BY id DESC",
    [classId]
  );
  return rows;
}

async function saveManualScript(user, classId, script) {
  const klass = await classService.getClassById(classId);
  await classService.assertClassAccess(klass, user, { mutate: true });
  await query(
    "UPDATE yoga_classes SET script_json = ?, script_manually_edited = 1 WHERE id = ?",
    [JSON.stringify(script), classId]
  );
  await audit(user.id, "script.save", "yoga_class", classId);
  return classService.mapClass(await classService.getClassById(classId));
}

module.exports = {
  mapJob,
  enqueueJob,
  listJobs,
  getJob,
  cancelJob,
  retryJob,
  processJob,
  startJobRunner,
  stopJobRunner,
  listAssets,
  saveManualScript,
  publicError,
};
