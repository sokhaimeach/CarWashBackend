const sequelize = require("../Config/db");
const Customer = require("../Models/customer.model");
const Membership = require("../Models/membership.model");
const pointsLog = require("../Models/pointsLog.model");
const CustomerMembership = require("../Models/customerMembership.model");

Customer.hasMany(CustomerMembership, {
  foreignKey: "customer_id",
  as: "memberships",
});
CustomerMembership.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});
CustomerMembership.belongsTo(Membership, {
  foreignKey: "membership_id",
  as: "plan",
});
Membership.hasMany(CustomerMembership, {
  foreignKey: "membership_id",
  as: "subscribers",
});
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ All models synchronized successfully.");
  } catch (error) {
    console.error("❌ Error synchronizing models:", error);
    throw error;
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  Customer,
  Membership,
  pointsLog,
  CustomerMembership,
};
