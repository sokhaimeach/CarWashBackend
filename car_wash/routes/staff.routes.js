const router = require("express").Router();
const { auth, requireRole } = require("../Middleware/authMiddleware");
const {
  validate,
  createStaffRules,
  updateStaffRules,
  updatePinRules,
  uuidParamRules,
  dateRangeRules,
} = require("../middleware/validate");
const c = require("../Controller/staff.controller");

router.use(auth);

router.get("/", requireRole("manager"), c.getAllStuff);
router.post(
  "/",
  createStaffRules,
  validate,
  requireRole("manager"),
  c.createStaff,
);
router.get(
  "/:id",
  uuidParamRules,
  validate,
  requireRole("manager"),
  c.getOneStaff,
);
router.put(
  "/:id",
  [...uuidParamRules, ...updateStaffRules],
  validate,
  requireRole("manager"),
  c.update,
);
router.patch(
  "/:id/pin",
  [...uuidParamRules, ...updatePinRules],
  validate,
  requireRole("manager"),
  c.updatePin,
);
router.patch(
  "/:id/deactivate",
  uuidParamRules,
  validate,
  requireRole("manager"),
  c.detactive,
);
router.patch(
  "/:id/activate",
  uuidParamRules,
  validate,
  requireRole("manager"),
  c.activeStaff,
);
router.get(
  "/:id/transactions",
  [...uuidParamRules, ...dateRangeRules],
  validate,
  requireRole("manager"),
  c.getStaffTransactions,
);

module.exports = router;
