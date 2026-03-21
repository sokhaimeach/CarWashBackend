const { DataTypes } = require("sequelize");
const sequelize = require("../Config/db");

const PurchaseOrder = sequelize.define(
  "purchase_orders",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    supplier_id: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "received", "cancelled"),
      defaultValue: "pending",
    },
    ordered_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    received_at: { type: DataTypes.DATE },
  },
  { tableName: "purchase_orders", timestamps: false },
);

module.exports = PurchaseOrder;
