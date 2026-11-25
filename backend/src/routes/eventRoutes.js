const express = require("express");
const eventController = require("../controllers/eventController");

const router = express.Router();

router.get("/", eventController.listEvents);
router.post("/", eventController.createEvent);
router.get("/:eventId", eventController.getEventById);
router.patch("/:eventId", eventController.updateEvent);
router.post("/:eventId/sponsors", eventController.addSponsor);

module.exports = router;
