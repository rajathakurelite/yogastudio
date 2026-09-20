const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const configs = require("./configs");
const routes = require("./routes/v1");
const { errorHandler, notFound } = require("./middlewares/errorHandler");

function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    })
  );
  app.use(
    cors({
      origin: configs.frontendOrigin.split(",").map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use("/media", express.static(configs.media.dir));
  app.get("/health", (req, res) => res.json({ ok: true, service: "yoga-studio-api" }));
  app.use("/api/v1", routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
