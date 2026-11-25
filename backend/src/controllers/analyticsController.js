const analyticsService = require("../services/analyticsService");
const { asyncHandler } = require("../middleware/errorHandler");

const getDashboardAnalytics = asyncHandler(async (_req, res) => {
  const data = await analyticsService.getDashboardAnalytics();
  res.json(data);
});

const getRevenueAnalytics = asyncHandler(async (_req, res) => {
  const revenueByEvent = await analyticsService.getRevenueByEvent();
  res.json(revenueByEvent);
});

const getDepartmentAnalytics = asyncHandler(async (_req, res) => {
  const departmentParticipation = await analyticsService.getDepartmentParticipation();
  res.json(departmentParticipation);
});

const getTurnoutAnalytics = asyncHandler(async (_req, res) => {
  const turnoutRates = await analyticsService.getTurnoutRates();
  res.json(turnoutRates);
});

const getClubAnalytics = asyncHandler(async (_req, res) => {
  const clubOverview = await analyticsService.getClubMembershipOverview();
  res.json(clubOverview);
});

module.exports = {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getDepartmentAnalytics,
  getTurnoutAnalytics,
  getClubAnalytics
};
