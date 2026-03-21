const Staff = require("../Models/staff.model");
const Transaction = require("../Models/transaction.model");
const Customer = require("../Models/customer.model");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const getAll = async (req, res, next) => {
  try {
    const rows = await Staff.findAll({
      attributes: {
        exclude: ["pin"],
      },
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const staff = await Staff.findByPk(req.params.id, {
      attributes: {
        exclude: ["pin"],
      },
    });
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    res.json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, role, pin } = req.body;
    const hashed = await bcrypt.hash(String(pin), 10);
    const staff = await Staff.create({ name, role, pin: hashed });
    res.status(201).json({
      success: true,
      data: {
        message: "Staff created",
        id: staff.id,
      },
    });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, role } = req.body;
    const [n] = await Staff.update(
      {
        name,
        role,
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
        .json({ success: false, message: "Staff not found" });

    res.json({
      success: true,
      data: {
        message: "Staff updated",
      },
    });
  } catch (err) {
    next(err);
  }
};

const updatePin = async (req, res, next) => {
  try {
    const hashed = await bcrypt.hash(String(req.body.pin), 10);
    const [n] = await Staff.update(
      {
        pin: hashed,
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
        .json({ success: false, message: "Staff not found" });

    res.json({
      success: true,
      data: {
        message: "PIN updated",
      },
    });
  } catch (err) {
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    if (req.params.id === req.staff.id)
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate your own account",
      });

    const [n] = await Staff.update(
      {
        is_active: false,
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
        .json({ success: false, message: "Staff not found" });

    res.json({
      success: true,
      data: {
        message: "Staff deactivated",
      },
    });
  } catch (err) {
    next(err);
  }
};

const activate = async (req, res, next) => {
  try {
    const [n] = await Staff.update(
      {
        is_active: true,
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
        .json({ success: false, message: "Staff not found" });

    res.json({
      success: true,
      data: {
        message: "Staff activated",
      },
    });
  } catch (err) {
    next(err);
  }
};

const getStaffTransactions = async (req, res, next) => {
  try {
    const from = req.query.from || new Date().toISOString().split("T")[0];
    const to = req.query.to || from;
    const rows = await Transaction.findAll({
      where: {
        staff_id: req.params.id,
        created_at: {
          [Op.between]: [`${from} 00:00:00`, `${to} 23:59:59`],
        },
      },
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  updatePin,
  deactivate,
  activate,
  getStaffTransactions,
};
