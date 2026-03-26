var express = require("express");
var router = express.Router();
const {
  getCategories,
  createCategory,
  deleteCategory,
} = require("../Controller/categoryController");
const { auth, requireRole } = require("../Middleware/authMiddleware");

// Routes
router.get("/", auth, getCategories);
router.post("/", auth, requireRole("Admin"), createCategory);
router.delete("/:id", auth, requireRole("Admin"), deleteCategory);

module.exports = router;

