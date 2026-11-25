const clubService = require("../services/clubService");
const { asyncHandler } = require("../middleware/errorHandler");

const listClubs = asyncHandler(async (req, res) => {
  const clubs = await clubService.listClubs(req.query);
  res.json(clubs);
});

const getClubById = asyncHandler(async (req, res) => {
  const club = await clubService.getClubById(req.params.clubId);
  res.json(club);
});

const createClub = asyncHandler(async (req, res) => {
  const club = await clubService.createClub(req.body);
  res.status(201).json({ message: "Club created", club });
});

const addClubMember = asyncHandler(async (req, res) => {
  const member = await clubService.addClubMember(req.params.clubId, req.body);
  res.status(201).json({
    message: "Member added to club",
    studentId: member.studentId,
    member
  });
});

const removeClubMember = asyncHandler(async (req, res) => {
  await clubService.removeClubMember(req.params.clubId, req.params.studentId);
  res.json({
    message: "Member removed from club",
    studentId: req.params.studentId
  });
});

module.exports = {
  listClubs,
  getClubById,
  createClub,
  addClubMember,
  removeClubMember
};
