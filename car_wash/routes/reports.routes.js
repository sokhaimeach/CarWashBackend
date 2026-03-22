const router = require("express").Router();
const { auth, requireRole } = require("../Middleware/authMiddleware");
const {
  getDailySummary,
  getSummary,
  getTopServices,
  getInventoryCOGS,
  getMembershipStats,
  getStaffPerformance,
} = require("../Controller/reports.controller");

router.use(auth, requireRole("manager"));

router.get("/summary", getSummary);
router.get("/top-services", getTopServices);
router.get("/inventory-cogs", getInventoryCOGS);
router.get("/membership-stats", getMembershipStats);
router.get("/staff-performance", getStaffPerformance);
router.get("/daily", getDailySummary);

module.exports = router;
