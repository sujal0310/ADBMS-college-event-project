const fs = require("fs");
const express = require("express");
const env = require("./config/env");
const apiRoutes = require("./routes");
const { requestLogger } = require("./middleware/requestLogger");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", env.corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    return next();
  });

  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

  app.use("/api", apiRoutes);
  app.use("/api", notFoundHandler);

  if (fs.existsSync(env.frontendDir)) {
    app.use(express.static(env.frontendDir));
  }

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
