const cron = require("node-cron");
const logger = require("../utils/logger");
const { query } = require("../db/pool");
const { notify } = require("../utils/helpers");

function startCron() {
  cron.schedule("0 6 * * *", async () => {
    try {
      const students = await query(
        `SELECT u.id FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE r.name = 'student' AND u.is_active = 1`
      );
      for (const s of students) {
        await notify(
          s.id,
          "daily.upcoming",
          "Daily Yoga is ready",
          "Start your day with movement, breath and balance.",
          "daily_yoga",
          null
        );
      }
      logger.info({ count: students.length }, "daily yoga notifications queued");
    } catch (err) {
      logger.error({ err: err.message }, "daily yoga cron failed");
    }
  });
}

module.exports = { startCron };
