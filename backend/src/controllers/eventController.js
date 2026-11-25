const eventService = require("../services/eventService");
const { asyncHandler } = require("../middleware/errorHandler");

const listEvents = asyncHandler(async (req, res) => {
  const events = await eventService.listEvents(req.query);
  res.json(events);
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.eventId);
  res.json(event);
});

const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body);
  res.status(201).json({ message: "Event created", event });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.eventId, req.body);
  res.json({ message: "Event updated", event });
});

const addSponsor = asyncHandler(async (req, res) => {
  const event = await eventService.addSponsor(req.params.eventId, req.body.sponsor);
  res.json({ message: "Sponsor list updated", event });
});

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  addSponsor
};
