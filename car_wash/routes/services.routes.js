const router = require("express").Router();
const { auth, requireRole } = require("../Middleware/authMiddleware");
const {
  validate,
  createServiceRules,
  consumptionRules,
  uuidParamRules,
} = require("../Middleware/validate");
const c = require("../Controller/services.controller");

router.use(auth);

router.get("/", c.getService);
router.post(
  "/",
  createServiceRules,
  validate,
  requireRole("manager"),
  c.crateService,
);
router.get("/:id", uuidParamRules, validate, c.getOneService);
router.put(
  "/:id",
  [...uuidParamRules, ...createServiceRules],
  validate,
  requireRole("manager"),
  c.updateService,
);
router.patch(
  "/:id/toggle",
  uuidParamRules,
  validate,
  requireRole("manager"),
  c.toggle,
);

router.get("/:id/consumption", uuidParamRules, validate, c.getConsumption);
router.post(
  "/:id/consumption",
  [...uuidParamRules, ...consumptionRules],
  validate,
  requireRole("manager"),
  c.addConsumption,
);
router.put(
  "/:id/consumption/:consumptionId",
  [...uuidParamRules, ...consumptionRules],
  validate,
  requireRole("manager"),
  c.updateConsumption,
);
router.delete(
  "/:id/consumption/:consumptionId",
  uuidParamRules,
  validate,
  requireRole("manager"),
  c.deleteConsumption,
);

module.exports = router;
