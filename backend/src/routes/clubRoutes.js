const express = require("express");
const clubController = require("../controllers/clubController");

const router = express.Router();

router.get("/", clubController.listClubs);
router.post("/", clubController.createClub);
router.get("/:clubId", clubController.getClubById);
router.post("/:clubId/members", clubController.addClubMember);
router.delete("/:clubId/members/:studentId", clubController.removeClubMember);

module.exports = router;
