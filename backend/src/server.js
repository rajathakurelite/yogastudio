const configs = require("./configs");
const { createApp } = require("./app");
const { ping } = require("./db/pool");
const { startJobRunner } = require("./services/generation.service");
const { startCron } = require("./jobs/cron");
const { ensureDir } = require("./utils/storage");
const logger = require("./utils/logger");

async function main() {
  ensureDir(configs.media.dir);
  await ping();
  startJobRunner();
  startCron();
  const app = createApp();
  app.listen(configs.port, () => {
    logger.info({ port: configs.port }, "yoga studio api listening");
  });
}

main().catch((err) => {
  logger.error({ err: err.message }, "failed to start");
  process.exit(1);
});
