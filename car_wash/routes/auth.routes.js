const router = require("express").Router();
const { validate, loginRules } = require("../middleware/validate");
const c = require("../Controller/auth.controller");
router.post("/login", loginRules, validate, c.login);

module.exports = router;
