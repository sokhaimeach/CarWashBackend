// Report Sample Controllers
const { Op, fn, col, literal } = require("sequelize");
const {
  sequelize,
  Transaction,
  TransactionItem,
  Payment,
  Service,
  Staff,
  Customer,
  CustomerMembership,
  Membership,
  InventoryItem,
  StockTransaction,
} = require("../Models");

// GET /api/reports/daily?date=
const getDailySummary = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const where = {
      status: "completed",
      created_at: {
        [Op.between]: [`${date} 00:00:00`, `${date} 23:59:59`],
      },
    };

    const revenue = await Transaction.findOne({
      where,
      attributes: [
        [fn("COUNT", col("id")), "txn_count"],
        [fn("SUM", col("total")), "revenue"],
        [fn("AVG", col("total")), "avg_ticket"],
      ],
      raw: true,
    });

    const topServices = await TransactionItem.findAll({
      include: [
        {
          model: Service,
          as: "service",
          attributes: ["name"],
        },
        {
          model: Transaction,
          as: undefined,
          attributes: [],
          where,
          required: true,
        },
      ],
      attributes: [
        "service_id",
        [fn("SUM", col("transaction_items.qty")), "qty"],
        [
          fn(
            "SUM",
            literal(
              "`transaction_items`.`qty` * `transaction_items`.`unit_price`",
            ),
          ),
          "revenue",
        ],
      ],
      group: ["service_id", "service.id", "service.name"],
      order: [[literal("revenue"), "DESC"]],
      limit: 5,
      raw: true,
      nest: true,
    });

    const alerts = await InventoryItem.findAll({
      where: sequelize.literal("current_stock <= reorder_level"),
      order: [["current_stock", "ASC"]],
    });

    res.success({
      date,
      revenue,
      top_services: topServices,
      low_stock_alerts: alerts,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/summary?from=&to=
const getSummary = async (req, res, next) => {
  try {
    const from = req.query.from || new Date().toISOString().split("T")[0];
    const to = req.query.to || from;
    const where = {
      status: "completed",
      created_at: {
        [Op.between]: [`${from} 00:00:00`, `${to} 23:59:59`],
      },
    };

    const revenue = await Transaction.findOne({
      where,
      attributes: [
        [fn("COUNT", col("id")), "total_transactions"],
        [fn("SUM", col("total")), "total_revenue"],
        [fn("AVG", col("total")), "avg_ticket"],
        [fn("SUM", col("discount_amount")), "total_discounts"],
        [fn("SUM", col("points_used")), "total_points_redeemed"],
      ],
      raw: true,
    });

    const byMethod = await Payment.findAll({
      include: [
        {
          model: Transaction,
          as: undefined,
          attributes: [],
          where,
          required: true,
        },
      ],
      attributes: [
        "method",
        [fn("COUNT", col("payments.id")), "count"],
        [fn("SUM", col("payments.amount")), "total"],
      ],
      group: ["method"],
      raw: true,
    });

    res.success({
      period: {
        from,
        to,
      },
      revenue,
      by_payment_method: byMethod,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/top-services?from=&to=&limit=5
const getTopServices = async (req, res, next) => {
  try {
    const from = req.query.from || new Date().toISOString().split("T")[0];
    const to = req.query.to || from;
    const limit = parseInt(req.query.limit) || 5;
    const txnWhere = {
      status: "completed",
      created_at: {
        [Op.between]: [`${from} 00:00:00`, `${to} 23:59:59`],
      },
    };

    const rows = await TransactionItem.findAll({
      include: [
        {
          model: Service,
          as: "service",
          attributes: ["name", "vehicle_type"],
        },
        {
          model: Transaction,
          as: undefined,
          attributes: [],
          where: txnWhere,
          required: true,
        },
      ],
      attributes: [
        "service_id",
        [fn("COUNT", col("transaction_items.id")), "times_sold"],
        [fn("SUM", col("transaction_items.qty")), "total_qty"],
        [
          fn(
            "SUM",
            literal(
              "`transaction_items`.`qty` * `transaction_items`.`unit_price`",
            ),
          ),
          "total_revenue",
        ],
      ],
      group: [
        "service_id",
        "service.id",
        "service.name",
        "service.vehicle_type",
      ],
      order: [[literal("total_revenue"), "DESC"]],
      limit,
      raw: true,
      nest: true,
    });
    res.success(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/inventory-cogs?from=&to=
const getInventoryCOGS = async (req, res, next) => {
  try {
    const from = req.query.from || new Date().toISOString().split("T")[0];
    const to = req.query.to || from;

    const rows = await StockTransaction.findAll({
      where: {
        type: "out",
        created_at: {
          [Op.between]: [`${from} 00:00:00`, `${to} 23:59:59`],
        },
      },
      include: [
        {
          model: InventoryItem,
          as: "item",
          attributes: ["name", "unit", "cost_per_unit"],
        },
      ],
      attributes: [
        "item_id",
        [fn("SUM", col("stock_transactions.qty")), "total_used"],
        [
          fn(
            "SUM",
            literal("`stock_transactions`.`qty` * `item`.`cost_per_unit`"),
          ),
          "total_cost",
        ],
      ],
      group: [
        "item_id",
        "item.id",
        "item.name",
        "item.unit",
        "item.cost_per_unit",
      ],
      order: [[literal("total_cost"), "DESC"]],
      raw: true,
      nest: true,
    });

    const total_cogs = rows.reduce(
      (sum, r) => sum + parseFloat(r.total_cost || 0),
      0,
    );
    res.success({
      period: {
        from,
        to,
      },
      total_cogs: total_cogs.toFixed(2),
      items: rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/membership-stats
const getMembershipStats = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const activeCount = await CustomerMembership.count({
      where: {
        status: "active",
      },
    });

    const expiredThisMonth = await CustomerMembership.count({
      where: {
        status: "expired",
        end_date: {
          [Op.between]: [monthStart, monthEnd],
        },
      },
    });

    const newThisMonth = await CustomerMembership.count({
      where: {
        start_date: {
          [Op.between]: [monthStart, monthEnd],
        },
      },
    });

    const byTier = await CustomerMembership.findAll({
      where: {
        status: "active",
      },
      include: [
        {
          model: Membership,
          as: "plan",
          attributes: ["name"],
        },
      ],
      attributes: [
        [fn("COUNT", col("customer_membership.id")), "count"],
        "membership_id",
      ],
      group: ["membership_id", "plan.id", "plan.name"],
      raw: true,
      nest: true,
    });

    const pointsLiability = await Customer.findOne({
      attributes: [[fn("SUM", col("points_balance")), "total_points"]],
      raw: true,
    });
    const liability = (
      (parseFloat(pointsLiability.total_points) || 0) / 100
    ).toFixed(2);

    res.success({
      active_members: activeCount,
      expired_this_month: expiredThisMonth,
      new_this_month: newThisMonth,
      by_tier: byTier,
      points_liability_dollars: liability,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/staff-performance?from=&to=
const getStaffPerformance = async (req, res, next) => {
  try {
    const from = req.query.from || new Date().toISOString().split("T")[0];
    const to = req.query.to || from;
    const where = {
      status: "completed",
      created_at: {
        [Op.between]: [`${from} 00:00:00`, `${to} 23:59:59`],
      },
    };

    const rows = await Transaction.findAll({
      where,
      include: [
        {
          model: Staff,
          as: "staff",
          attributes: ["name", "role"],
        },
      ],
      attributes: [
        "staff_id",
        [fn("COUNT", col("transactions.id")), "total_transactions"],
        [fn("SUM", col("transactions.total")), "total_sales"],
        [fn("AVG", col("transactions.total")), "avg_ticket"],
      ],
      group: ["staff_id", "staff.id", "staff.name", "staff.role"],
      order: [[literal("total_sales"), "DESC"]],
      raw: true,
      nest: true,
    });

    res.success(rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDailySummary,
  getSummary,
  getTopServices,
  getInventoryCOGS,
  getMembershipStats,
  getStaffPerformance,
};
