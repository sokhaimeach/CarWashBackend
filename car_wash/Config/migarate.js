const sequelize = require("./db");
const cutomer = require("../Models/customer.model");
const membership = require("../Models/membership.model");
const pointsLog = require("../Models/pointsLog.model");
const CustomerMemeberShip = require("../Models/customerMembership.model");
(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ Migration completed");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  }
})();
