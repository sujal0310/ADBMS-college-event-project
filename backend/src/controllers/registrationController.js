const registrationService = require("../services/registrationService");
const { asyncHandler } = require("../middleware/errorHandler");

const listRegistrations = asyncHandler(async (req, res) => {
  const registrations = await registrationService.listRegistrations(req.query);
  res.json(registrations);
});

const getRegistrationByTicketId = asyncHandler(async (req, res) => {
  const registration = await registrationService.getRegistrationByTicketId(req.params.ticketId);
  res.json(registration);
});

const bookTicket = asyncHandler(async (req, res) => {
  const { ticket, seatsRemaining } = await registrationService.bookTicket(req.body);
  res.status(201).json({
    message: "Ticket booked successfully",
    ticket,
    seatsRemaining
  });
});

const checkInTicket = asyncHandler(async (req, res) => {
  const registration = await registrationService.checkInTicket(req.params.ticketId);
  res.json({
    message: "Check-in confirmed",
    registration
  });
});

const cancelTicket = asyncHandler(async (req, res) => {
  const cancelled = await registrationService.cancelTicket(req.params.ticketId);
  res.json({
    message: "Registration cancelled and seat released",
    ticketId: cancelled.ticketId,
    eventId: cancelled.eventId
  });
});

module.exports = {
  listRegistrations,
  getRegistrationByTicketId,
  bookTicket,
  checkInTicket,
  cancelTicket
};
