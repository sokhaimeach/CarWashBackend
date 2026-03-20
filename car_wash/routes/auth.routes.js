const router = require("express").Router();
const c = require("../Controller/auth.controller");
const { loginRules, validate } = require("../Middleware/validate");

router.post("/login", loginRules, validate, c.login);

module.exports = router;
