const express = require("express");
const systemController = require("../controllers/systemController");
const clubRoutes = require("./clubRoutes");
const eventRoutes = require("./eventRoutes");
const registrationRoutes = require("./registrationRoutes");
const analyticsRoutes = require("./analyticsRoutes");

const router = express.Router();

router.get("/health", systemController.getHealth);
router.post("/seed", systemController.runSeed);

router.use("/clubs", clubRoutes);
router.use("/events", eventRoutes);
router.use("/registrations", registrationRoutes);
router.use("/analytics", analyticsRoutes);

module.exports = router;
