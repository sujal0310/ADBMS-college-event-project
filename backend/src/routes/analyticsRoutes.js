const express = require("express");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();

router.get("/", analyticsController.getDashboardAnalytics);
router.get("/revenue", analyticsController.getRevenueAnalytics);
router.get("/departments", analyticsController.getDepartmentAnalytics);
router.get("/turnout", analyticsController.getTurnoutAnalytics);
router.get("/clubs", analyticsController.getClubAnalytics);

module.exports = router;
