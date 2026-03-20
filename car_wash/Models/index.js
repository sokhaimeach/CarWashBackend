const sequelize = require("../Config/db");
const Customer = require("../Models/customer.model");
const Membership = require("../Models/membership.model");
const pointsLog = require("../Models/pointsLog.model");
const CustomerMembership = require("../Models/customerMembership.model");
const Staff = require("../Models/staff.model");
const Transaction = require("../Models/transaction.model");
const Service = require("../Models/service.model");
const ServiceConsumption = require("../Models/serviceConsumption.model");
// const serviceConsumptionModel = require("../Models/serviceConsumption.model");
const InventoryItem = require("../Models/inventoryItem.model");
const serviceConsumption = require("../Models/serviceConsumption.model");
// Customer.hasMany(CustomerMembership, {
//   foreignKey: "customer_id",
//   as: "memberships",
// });
// CustomerMembership.belongsTo(Customer, {
//   foreignKey: "customer_id",
//   as: "customer",
// });
// CustomerMembership.belongsTo(Membership, {
//   foreignKey: "membership_id",
//   as: "plan",
// });
// Membership.hasMany(CustomerMembership, {
//   foreignKey: "membership_id",
//   as: "subscribers",
// });
// // Customer → Transactions
// Customer.hasMany(Transaction, {
//   foreignKey: "customer_id",
//   as: "transactions",
// });

// Transaction.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });
// // Staff → Transactions
// Staff.hasMany(Transaction, { foreignKey: "staff_id", as: "transactions" });
// Transaction.belongsTo(Staff, { foreignKey: "staff_id", as: "staff" });
// Service ↔ InventoryItem (through ServiceConsumption)
Service.hasMany(ServiceConsumption, {
  foreignKey: "service_id",
  as: "consumptionRules",
});
ServiceConsumption.belongsTo(Service, { foreignKey: "service_id" });
ServiceConsumption.belongsTo(InventoryItem, {
  foreignKey: "item_id",
  as: "item",
});
InventoryItem.hasMany(ServiceConsumption, { foreignKey: "item_id" });
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
  // Customer,
  // Membership,
  // pointsLog,
  // CustomerMembership,
  serviceConsumption,
  Service,
  InventoryItem,
};
