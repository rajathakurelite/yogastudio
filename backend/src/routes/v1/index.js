const express = require("express");
const rateLimit = require("express-rate-limit");
const { isAuth, requireRoles, optionalAuth } = require("../../middlewares/isAuth");
const { validate } = require("../../utils/helpers");
const v = require("../../validators/yoga.validators");
const c = require("../../controllers/yoga.controller");
const configs = require("../../configs");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: configs.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
});
const genLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: configs.rateLimit.generationMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "RATE_LIMITED",
    message: "Too many generation requests. Please wait and try again.",
  },
});

router.post("/auth/register", authLimiter, v.register, validate, c.auth.register);
router.post("/auth/login", authLimiter, v.login, validate, c.auth.login);
router.get("/auth/me", isAuth, c.auth.me);
router.put("/auth/profile", isAuth, c.auth.updateProfile);

router.get("/yoga/styles", c.catalog.styles);
router.get("/yoga/goals", c.catalog.goals);
router.get("/yoga/poses", c.catalog.poses);
router.get("/yoga/providers/capabilities", isAuth, c.catalog.capabilities);

router.get("/yoga/classes", optionalAuth, v.listClasses, validate, c.classes.list);
router.get("/yoga/classes/:id", optionalAuth, v.idParam, validate, c.classes.get);
router.post(
  "/yoga/classes",
  isAuth,
  requireRoles("instructor", "admin"),
  v.createClass,
  validate,
  c.classes.create
);
router.put(
  "/yoga/classes/:id",
  isAuth,
  requireRoles("instructor", "admin"),
  v.idParam,
  validate,
  c.classes.update
);
router.delete(
  "/yoga/classes/:id",
  isAuth,
  requireRoles("instructor", "admin"),
  v.idParam,
  validate,
  c.classes.remove
);

router.get(
  "/yoga/classes/:id/sequence",
  isAuth,
  v.idParam,
  validate,
  c.classes.sequence
);
router.put(
  "/yoga/classes/:id/sequence",
  isAuth,
  requireRoles("instructor", "admin"),
  c.classes.saveSequence
);
router.put(
  "/yoga/classes/:id/sequence/:itemId",
  isAuth,
  requireRoles("instructor", "admin"),
  c.classes.updateItem
);

router.post(
  "/yoga/classes/:id/generate-plan",
  isAuth,
  requireRoles("instructor", "admin"),
  genLimiter,
  v.idParam,
  validate,
  (req, res, next) => {
    req.body.assetType = "CLASS_PLAN";
    req.body.force = true;
    return c.generation.enqueue(req, res, next);
  }
);
router.post(
  "/yoga/classes/:id/generate-script",
  isAuth,
  requireRoles("instructor", "admin"),
  genLimiter,
  (req, res, next) => {
    req.body.assetType = "SCRIPT";
    return c.generation.enqueue(req, res, next);
  }
);
router.post(
  "/yoga/classes/:id/generate-media",
  isAuth,
  requireRoles("instructor", "admin"),
  genLimiter,
  c.generation.enqueueMany
);
router.post(
  "/yoga/classes/:id/generate",
  isAuth,
  requireRoles("instructor", "admin"),
  genLimiter,
  v.generate,
  validate,
  c.generation.enqueue
);
router.get("/yoga/classes/:id/generation-jobs", isAuth, c.generation.jobs);
router.get("/yoga/generation-jobs/:jobId", isAuth, c.generation.getJob);
router.post(
  "/yoga/generation-jobs/:jobId/retry",
  isAuth,
  requireRoles("instructor", "admin"),
  genLimiter,
  c.generation.retry
);
router.post(
  "/yoga/generation-jobs/:jobId/cancel",
  isAuth,
  requireRoles("instructor", "admin"),
  c.generation.cancel
);
router.put(
  "/yoga/classes/:id/script",
  isAuth,
  requireRoles("instructor", "admin"),
  c.generation.saveScript
);

router.post(
  "/yoga/classes/:id/submit",
  isAuth,
  requireRoles("instructor", "admin"),
  c.classes.submit
);
router.post(
  "/yoga/classes/:id/publish",
  isAuth,
  requireRoles("instructor", "admin"),
  c.classes.publish
);
router.post(
  "/yoga/classes/:id/moderate",
  isAuth,
  requireRoles("admin"),
  c.classes.moderate
);
router.post(
  "/yoga/classes/:id/schedule",
  isAuth,
  requireRoles("instructor", "admin"),
  v.schedule,
  validate,
  c.schedule.create
);

router.get("/yoga/student/home", isAuth, requireRoles("student", "instructor", "admin"), c.student.home);
router.get("/yoga/daily", isAuth, c.student.daily);
router.post("/yoga/classes/:id/join", isAuth, requireRoles("student", "instructor", "admin"), c.student.join);
router.post("/yoga/classes/:id/progress", isAuth, c.student.progress);
router.post("/yoga/classes/:id/complete", isAuth, c.student.complete);
router.get("/yoga/student/history", isAuth, c.student.history);

router.get("/yoga/instructor/dashboard", isAuth, requireRoles("instructor", "admin"), c.instructor.dashboard);
router.get("/yoga/instructor/analytics", isAuth, requireRoles("instructor", "admin"), c.instructor.dashboard);
router.get(
  "/yoga/classes/:id/participation",
  isAuth,
  requireRoles("instructor", "admin"),
  c.instructor.participation
);

router.get("/yoga/schedule", isAuth, c.schedule.list);

router.get("/yoga/notifications", isAuth, c.admin.notifications);
router.post("/yoga/notifications/:id/read", isAuth, c.admin.readNotification);

router.get("/yoga/admin/users", isAuth, requireRoles("admin"), c.admin.users);
router.patch(
  "/yoga/admin/users/:userId",
  isAuth,
  requireRoles("admin"),
  c.admin.setUserActive
);
router.get("/yoga/admin/analytics", isAuth, requireRoles("admin"), c.admin.analytics);
router.get("/yoga/admin/generation-jobs", isAuth, requireRoles("admin"), c.admin.jobs);
router.post("/yoga/admin/poses", isAuth, requireRoles("admin"), c.admin.createPose);
router.put("/yoga/admin/poses/:poseId", isAuth, requireRoles("admin"), c.admin.updatePose);
router.post("/yoga/admin/styles", isAuth, requireRoles("admin"), c.admin.createStyle);
router.post("/yoga/admin/goals", isAuth, requireRoles("admin"), c.admin.createGoal);

module.exports = router;
