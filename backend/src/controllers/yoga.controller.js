const authService = require("../services/auth.service");
const classService = require("../services/class.service");
const generationService = require("../services/generation.service");
const participationService = require("../services/participation.service");
const catalogService = require("../services/catalog.service");
const { providerCapabilities } = require("../providers/fableProvider");
const { ASSET_TYPES } = require("../utils/helpers");

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

const auth = {
  register: async (req, res, next) => {
    try {
      ok(res, await authService.register(req.body), 201);
    } catch (e) {
      next(e);
    }
  },
  login: async (req, res, next) => {
    try {
      ok(res, await authService.login(req.body));
    } catch (e) {
      next(e);
    }
  },
  me: async (req, res) => ok(res, { user: req.user }),
  updateProfile: async (req, res, next) => {
    try {
      ok(res, { user: await authService.updateProfile(req.user.id, req.body) });
    } catch (e) {
      next(e);
    }
  },
};

const catalog = {
  styles: async (req, res, next) => {
    try {
      ok(res, await catalogService.listStyles());
    } catch (e) {
      next(e);
    }
  },
  goals: async (req, res, next) => {
    try {
      ok(res, await catalogService.listGoals());
    } catch (e) {
      next(e);
    }
  },
  poses: async (req, res, next) => {
    try {
      ok(res, await catalogService.listPoses(req.query));
    } catch (e) {
      next(e);
    }
  },
  capabilities: async (req, res) => ok(res, providerCapabilities()),
};

const classes = {
  list: async (req, res, next) => {
    try {
      const query = { ...req.query };
      if (req.user?.roles?.includes("admin") && query.status == null) {
        query.status = "";
      }
      ok(res, await classService.listCatalog(query));
    } catch (e) {
      next(e);
    }
  },
  get: async (req, res, next) => {
    try {
      const row = await classService.getClassById(req.params.id);
      await classService.assertClassAccess(row, req.user || { roles: [] });
      const sequence = await classService.listSequence(req.params.id);
      const assets = await generationService.listAssets(req.params.id);
      ok(res, { class: classService.mapClass(row), sequence: sequence.items, assets });
    } catch (e) {
      next(e);
    }
  },
  create: async (req, res, next) => {
    try {
      ok(res, await classService.createClass(req.user, req.body), 201);
    } catch (e) {
      next(e);
    }
  },
  update: async (req, res, next) => {
    try {
      ok(res, await classService.updateClass(req.user, req.params.id, req.body));
    } catch (e) {
      next(e);
    }
  },
  remove: async (req, res, next) => {
    try {
      await classService.deleteClass(req.user, req.params.id);
      ok(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  },
  sequence: async (req, res, next) => {
    try {
      const row = await classService.getClassById(req.params.id);
      await classService.assertClassAccess(row, req.user);
      ok(res, await classService.listSequence(req.params.id));
    } catch (e) {
      next(e);
    }
  },
  saveSequence: async (req, res, next) => {
    try {
      ok(res, await classService.replaceSequence(req.user, req.params.id, req.body.items || []));
    } catch (e) {
      next(e);
    }
  },
  updateItem: async (req, res, next) => {
    try {
      ok(
        res,
        await classService.updateSequenceItem(
          req.user,
          req.params.id,
          req.params.itemId,
          req.body
        )
      );
    } catch (e) {
      next(e);
    }
  },
  submit: async (req, res, next) => {
    try {
      ok(res, await classService.submitForReview(req.user, req.params.id));
    } catch (e) {
      next(e);
    }
  },
  publish: async (req, res, next) => {
    try {
      ok(res, await classService.publishClass(req.user, req.params.id));
    } catch (e) {
      next(e);
    }
  },
  moderate: async (req, res, next) => {
    try {
      ok(
        res,
        await classService.moderateClass(
          req.user,
          req.params.id,
          req.body.action,
          req.body.reason
        )
      );
    } catch (e) {
      next(e);
    }
  },
};

const generation = {
  enqueue: async (req, res, next) => {
    try {
      ok(
        res,
        await generationService.enqueueJob(
          req.user,
          req.params.id,
          req.body.assetType,
          req.body.input || {},
          { force: Boolean(req.body.force) }
        ),
        202
      );
    } catch (e) {
      next(e);
    }
  },
  enqueueMany: async (req, res, next) => {
    try {
      const types = req.body.assetTypes || ASSET_TYPES.filter((t) => t !== "CLASS_PLAN");
      const jobs = [];
      for (const assetType of types) {
        jobs.push(
          await generationService.enqueueJob(
            req.user,
            req.params.id,
            assetType,
            { ...(req.body.input || {}), regenerate: Boolean(req.body.regenerate) },
            { force: true }
          )
        );
      }
      ok(res, { jobs }, 202);
    } catch (e) {
      next(e);
    }
  },
  jobs: async (req, res, next) => {
    try {
      ok(res, await generationService.listJobs(req.params.id));
    } catch (e) {
      next(e);
    }
  },
  getJob: async (req, res, next) => {
    try {
      ok(res, await generationService.getJob(req.params.jobId));
    } catch (e) {
      next(e);
    }
  },
  retry: async (req, res, next) => {
    try {
      ok(res, await generationService.retryJob(req.user, req.params.jobId));
    } catch (e) {
      next(e);
    }
  },
  cancel: async (req, res, next) => {
    try {
      ok(res, await generationService.cancelJob(req.user, req.params.jobId));
    } catch (e) {
      next(e);
    }
  },
  saveScript: async (req, res, next) => {
    try {
      ok(res, await generationService.saveManualScript(req.user, req.params.id, req.body));
    } catch (e) {
      next(e);
    }
  },
};

const student = {
  home: async (req, res, next) => {
    try {
      ok(res, await participationService.studentDashboard(req.user.id));
    } catch (e) {
      next(e);
    }
  },
  daily: async (req, res, next) => {
    try {
      ok(res, await participationService.getDailyYoga());
    } catch (e) {
      next(e);
    }
  },
  join: async (req, res, next) => {
    try {
      ok(res, await participationService.joinClass(req.user, req.params.id));
    } catch (e) {
      next(e);
    }
  },
  progress: async (req, res, next) => {
    try {
      ok(res, await participationService.progressClass(req.user, req.params.id, req.body));
    } catch (e) {
      next(e);
    }
  },
  complete: async (req, res, next) => {
    try {
      ok(res, await participationService.completeClass(req.user, req.params.id, req.body));
    } catch (e) {
      next(e);
    }
  },
  history: async (req, res, next) => {
    try {
      ok(res, await participationService.studentHistory(req.user.id));
    } catch (e) {
      next(e);
    }
  },
};

const instructor = {
  dashboard: async (req, res, next) => {
    try {
      const analytics = await classService.instructorAnalytics(req.user.id);
      const classes = await classService.instructorClasses(req.user.id);
      const jobs = [];
      for (const c of classes.slice(0, 8)) {
        jobs.push(...(await generationService.listJobs(c.id)));
      }
      ok(res, {
        analytics,
        classes,
        upcoming: classes.filter((c) => c.status === "published").slice(0, 5),
        drafts: classes.filter((c) => c.status === "draft"),
        jobs: jobs.slice(0, 20),
      });
    } catch (e) {
      next(e);
    }
  },
  participation: async (req, res, next) => {
    try {
      ok(res, await participationService.classParticipation(req.user, req.params.id));
    } catch (e) {
      next(e);
    }
  },
};

const schedule = {
  list: async (req, res, next) => {
    try {
      ok(res, await participationService.listSchedule(req.query));
    } catch (e) {
      next(e);
    }
  },
  create: async (req, res, next) => {
    try {
      ok(
        res,
        await participationService.scheduleClass(req.user, req.params.id, req.body),
        201
      );
    } catch (e) {
      next(e);
    }
  },
};

const admin = {
  users: async (req, res, next) => {
    try {
      ok(res, await catalogService.listUsers(req.query.role));
    } catch (e) {
      next(e);
    }
  },
  setUserActive: async (req, res, next) => {
    try {
      await catalogService.setUserActive(req.user, req.params.userId, req.body.isActive);
      ok(res, { updated: true });
    } catch (e) {
      next(e);
    }
  },
  analytics: async (req, res, next) => {
    try {
      ok(res, await catalogService.platformAnalytics());
    } catch (e) {
      next(e);
    }
  },
  jobs: async (req, res, next) => {
    try {
      ok(res, await catalogService.listGenerationJobs(req.query));
    } catch (e) {
      next(e);
    }
  },
  createPose: async (req, res, next) => {
    try {
      ok(res, await catalogService.createPose(req.user, req.body), 201);
    } catch (e) {
      next(e);
    }
  },
  updatePose: async (req, res, next) => {
    try {
      ok(res, await catalogService.updatePose(req.user, req.params.poseId, req.body));
    } catch (e) {
      next(e);
    }
  },
  createStyle: async (req, res, next) => {
    try {
      ok(res, await catalogService.createStyle(req.user, req.body), 201);
    } catch (e) {
      next(e);
    }
  },
  createGoal: async (req, res, next) => {
    try {
      ok(res, await catalogService.createGoal(req.user, req.body), 201);
    } catch (e) {
      next(e);
    }
  },
  notifications: async (req, res, next) => {
    try {
      ok(res, await catalogService.listNotifications(req.user.id));
    } catch (e) {
      next(e);
    }
  },
  readNotification: async (req, res, next) => {
    try {
      await catalogService.markNotificationRead(req.user.id, req.params.id);
      ok(res, { read: true });
    } catch (e) {
      next(e);
    }
  },
};

module.exports = { auth, catalog, classes, generation, student, instructor, schedule, admin };
