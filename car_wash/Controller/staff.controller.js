const Staff = require("../Models/staff.model");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const sequelize = require("../Config/db");
const Customer = require("../Models/customer.model");
const Transaction = require("../Models/transaction.model");

// get All Stuff
const getAllStuff = async (req, res, next) => {
  try {
    const AllStuff = await Staff.findAll({
      attributes: {
        exclude: ["pin"],
      },
      order: [["name", "ASC"]],
    });
    if (!AllStuff) {
      return res
        .status(404)
        .joson({ success: false, message: "No staff found" });
    }
    res.status(200).json(AllStuff);
  } catch (error) {
    next(error);
  }
};
// get One Staff
const getOneStaff = async (req, res, next) => {
  try {
    const getOneStaff = await Staff.findByPk(req.params.id, {
      attributes: {
        exclude: ["pin"],
      },
    });
    if (!getOneStaff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });
    }
    res.status(200).json(getOneStaff);
  } catch (error) {
    next(error);
  }
};
// create Staff
const createStaff = async (req, res, next) => {
  try {
    const { name, role, pin } = req.body;
    const hased = await bcrypt.hash(String(pin), 10);
    const staff = await Staff.create({ name, role, pin: hased });
    res.status(202).json({
      success: true,
      data: {
        message: "Staff created successfully",
        id: staff.id,
      },
    });
  } catch (error) {
    next(error);
  }
};
// update Staff

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
// update Pin
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

// detective Staff
const detactive = async (req, res, next) => {
  try {
    if (req.params.id === req.stff.id) {
      return res
        .staus(400)
        .json({ success: false, message: "You can't detactive yourself" });
    }
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
    if (!n) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }
    res.status(200).json({
      success: true,
      data: {
        message: "Staff detactived",
      },
    });
  } catch (error) {
    next(error);
  }
};
// active Staff
const activeStaff = async (req, res, next) => {
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
    if (!n) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }
    res.status(200).json({
      success: true,
      data: {
        message: "Staff actived",
      },
    });
  } catch (error) {
    next(error);
  }
};
// getStaffTransactions
const getStaffTransactions = async (req, res, next) => {
  try {
    // date filter
    const from = req.query.from || new Date().toISOString().split("T")[0];
    const to = req.query.to || from;
    const transaction = await Transaction.findAll({
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
          attributes: ["name", "phone"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStuff,
  createStaff,
  getOneStaff,
  update,
  updatePin,
  detactive,
  activeStaff,
  getStaffTransactions,
};
