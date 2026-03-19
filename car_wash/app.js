require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/auth.routes");
var categoriesRouter = require("./routes/categories");
// Initialize database
const sequelize = require("./Config/db");
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database models synchronized");
  })
  .catch((err) => {
    console.error("Failed to sync database models", err);
  });

var app = express();

app.use(cors());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// syncDatabase();
app.use("/", indexRouter);
app.use("/api/auth", usersRouter);
// app.use("/categories", categoriesRouter);

// customr routes
const customerRoutes = require("./routes/loyalty.routes");
app.use("/api/v1/loyalty", customerRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
