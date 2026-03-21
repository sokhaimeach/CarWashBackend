const router = require("express").Router();
const { auth, requireRole } = require("../Middleware/authMiddleware");
const {
  validate,
  createItemRules,
  createSupplierRules,
  createPurchaseOrderRules,
  uuidParamRules,
  paginationRules,
} = require("../Middleware/validate");
const {
  getItems,
  getLowStock,
  createItem,
  updateItem,
  getStockHistory,
  getSuppliers,
  createSupplier,
  updateSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} = require("../Controller/inventory.controller");

router.use(auth);

// items and stock transctions routes
router.get("/items", paginationRules, validate, getItems);
router.get("/items/alerts", getLowStock);
router.post(
  "/items",
  createItemRules,
  validate,
  requireRole("manager"),
  createItem,
);
router.put(
  "/items/:id",
  [...uuidParamRules, ...createItemRules],
  validate,
  requireRole("manager"),
  updateItem,
);
router.get(
  "/items/:id/transactions",
  [...uuidParamRules, ...paginationRules],
  validate,
  getStockHistory,
);

// suppliers routes
router.get("/suppliers", paginationRules, validate, getSuppliers);
router.post(
  "/suppliers",
  createSupplierRules,
  validate,
  requireRole("manager"),
  createSupplier,
);
router.put(
  "/suppliers/:id",
  [...uuidParamRules, ...createSupplierRules],
  validate,
  requireRole("manager"),
  updateSupplier,
);

// purchase order and purchase order items routes
router.get("/purchase-orders", getPurchaseOrders);
router.post(
  "/purchase-orders",
  createPurchaseOrderRules,
  validate,
  requireRole("manager"),
  createPurchaseOrder,
);
router.patch(
  "/purchase-orders/:id/receive",
  uuidParamRules,
  validate,
  requireRole("manager"),
  receivePurchaseOrder,
);
router.patch(
  "/purchase-orders/:id/cancel",
  uuidParamRules,
  validate,
  requireRole("manager"),
  cancelPurchaseOrder,
);

module.exports = router;
