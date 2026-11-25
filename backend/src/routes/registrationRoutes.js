const express = require("express");
const registrationController = require("../controllers/registrationController");

const router = express.Router();

router.get("/", registrationController.listRegistrations);
router.post("/book", registrationController.bookTicket);
router.get("/:ticketId", registrationController.getRegistrationByTicketId);
router.patch("/:ticketId/check-in", registrationController.checkInTicket);
router.delete("/:ticketId", registrationController.cancelTicket);

module.exports = router;
