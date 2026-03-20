// Customer Model Include

const { Op } = require("sequelize");
const Customer = require("../Models/customer.model");
const Membership = require("../Models/membership.model");
const CustomerMembership = require("../Models/customerMembership.model");
const PointsLog = require("../Models/pointsLog.model");
const sequelize = require("../Config/db");
const Transaction = require("../Models/transaction.model");
const getCustomers = async (req, res, next) => {
  try {
    const rows = await Customer.findAll({
      include: [
        {
          model: CustomerMembership,
          as: "memberships",
          where: {
            status: "active",
          },
          required: false,
          include: [
            {
              model: Membership,
              as: "plan",
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const getExpiring = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);
    const rows = await CustomerMembership.findAll({
      where: {
        status: "active",
        end_date: {
          [Op.between]: [today, future],
        },
      },
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["name", "phone"],
        },
        {
          model: Membership,
          as: "plan",
          attributes: ["name"],
        },
      ],
      order: [["end_date", "ASC"]],
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        {
          model: CustomerMembership,
          as: "memberships",
          where: {
            status: "active",
          },
          required: false,
          include: [
            {
              model: Membership,
              as: "plan",
            },
          ],
        },
      ],
    });
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, vehicle_plate } = req.body;
    const c = await Customer.create({
      name,
      phone,
      email: email || null,
      vehicle_plate: vehicle_plate || null,
    });
    res.status(201).json({
      success: true,
      data: {
        message: "Customer created",
        id: c.id,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, vehicle_plate } = req.body;
    const [n] = await Customer.update(
      {
        name,
        phone,
        email: email || null,
        vehicle_plate: vehicle_plate || null,
      },
      {
        where: {
          id: req.params.id,
        },
      },
    );
    if (!n)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    res.json({
      success: true,
      data: {
        message: "Customer updated",
      },
    });
  } catch (err) {
    next(err);
  }
};

const getCustomerTransactions = async (req, res, next) => {
  try {
    const rows = await Transaction.findAll({
      where: {
        customer_id: req.params.id,
      },
      include: [
        {
          model: Staff,
          as: "staff",
          attributes: ["name"],
        },
        {
          model: Payment,
          as: "payments",
          attributes: ["method", "amount"],
        },
        {
          model: TransactionItem,
          as: "items",
          include: [
            {
              model: Service,
              as: "service",
              attributes: ["name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const getPointsHistory = async (req, res, next) => {
  try {
    const rows = await PointsLog.findAll({
      where: {
        customer_id: req.params.id,
      },
      include: [
        {
          model: Transaction,
          as: "transaction",
          attributes: ["total"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const adjustPoints = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { points, note } = req.body;
    const customer = await Customer.findByPk(req.params.id, { transaction: t });
    if (!customer) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const newBalance = customer.points_balance + parseInt(points);
    if (newBalance < 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot deduct ${Math.abs(points)} pts — balance is only ${
          customer.points_balance
        }`,
      });
    }
    await customer.update(
      {
        points_balance: newBalance,
      },
      { transaction: t },
    );
    await PointsLog.create(
      {
        customer_id: req.params.id,
        transaction_id: null,
        points_earned: points > 0 ? points : 0,
        points_used: points < 0 ? Math.abs(points) : 0,
        balance_after: newBalance,
        note,
      },
      { transaction: t },
    );

    await t.commit();
    res.json({
      success: true,
      data: {
        message: "Points adjusted",
        new_balance: newBalance,
      },
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

const assignMembership = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { membership_id } = req.body;
    const plan = await Membership.findByPk(membership_id, { transaction: t });
    if (!plan) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Membership plan not found" });
    }

    await CustomerMembership.update(
      {
        status: "cancelled",
      },
      {
        where: {
          customer_id: req.params.id,
          status: "active",
        },
        transaction: t,
      },
    );

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + plan.duration_days);
    const fmt = (d) => d.toISOString().split("T")[0];

    const cm = await CustomerMembership.create(
      {
        customer_id: req.params.id,
        membership_id: plan.id,
        start_date: fmt(start),
        end_date: fmt(end),
        status: "active",
      },
      { transaction: t },
    );

    await t.commit();
    res.status(201).json({
      success: true,
      data: {
        message: "Membership assigned",
        id: cm.id,
        start_date: fmt(start),
        end_date: fmt(end),
      },
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

const cancelMembership = async (req, res, next) => {
  try {
    const [n] = await CustomerMembership.update(
      {
        status: "cancelled",
      },
      {
        where: {
          customer_id: req.params.id,
          status: "active",
        },
      },
    );
    if (!n)
      return res
        .status(404)
        .json({ success: false, message: "No active membership found" });

    res.json({
      success: true,
      data: {
        message: "Membership cancelled",
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMemberships = async (req, res, next) => {
  try {
    const rows = await Membership.findAll({
      order: [["price", "ASC"]],
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const getAllPointsActivity = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const offset = (page - 1) * limit;
    const { count, rows } = await PointsLog.findAndCountAll({
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["name", "phone"],
        },
        {
          model: Transaction,
          as: "transaction",
          attributes: ["total"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
      distinct: true,
    });
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomers,
  getExpiring,
  getCustomer,
  createCustomer,
  updateCustomer,
  getCustomerTransactions,
  getPointsHistory,
  adjustPoints,
  assignMembership,
  cancelMembership,
  getMemberships,
  getAllPointsActivity,
};
