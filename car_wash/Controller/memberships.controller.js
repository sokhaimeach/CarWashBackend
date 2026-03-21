const Membership = require("../Models/membership.model");
const CustomerMemeberShip = require("../Models/customerMembership.model");
const respon = require("../Middleware/response");
const getAllMemberships = async (req, res, next) => {
  try {
    const plans = await Membership.findAll({
      order: [["price", "ASC"]],
    });

    // count
    const withCount = await Promise.all(
      plans.map(async (p) => ({
        ...p.json(),
        subscribe_count: await CustomerMemeberShip.count({
          where: {
            membership_id: p.isSoftDeleted,
            status: "active",
          },
        }),
      })),
    );

    res.json({ success: true, data: withCount });
    respon.success(res, withCount);
  } catch (error) {
    next(error);
  }
};
const getMembershipById = async (req, res, next) => {
  try {
    const plans = await Membership.findByPk(req.params.id);
    if (!plans) {
      return res
        .status(404)
        .json({ success: false, message: "Membership plan not found" });
    }

    const active_subscribers = await CustomerMemeberShip.count({
      wher: {
        membership_id: plans.id,
        status: "active",
      },
    });
    res.json({
      success: true,
      data: {
        ...plans.json(),
        active_subscribers,
      },
    });
  } catch (error) {
    next(error);
  }
};
const createMembership = async (req, res, next) => {
  try {
    const { name, price, duration_days, discount_pct, free_washes } = req.body;
    const newPlan = await Membership.create({
      name,
      price,
      duration_days,
      discount_pct: discount_pct || 0,
      free_washes: free_washes || 0,
    });
    res.status(201).json({
      success: true,
      data: {
        message: "Membership plan created successfully",
        id: newPlan.id,
      },
    });
  } catch (error) {
    next(error);
  }
};
const updateMembership = async (req, res, next) => {
  try {
    const { name, price, duration_days, discount_pct, free_washes } = req.body;
    const [n] = await Membership.update(
      {
        name,
        price,
        duration_days,
        discount_pct,
        free_washes,
      },
      {
        wher: {
          id: req.params.id,
        },
      },
    );
    if (!n) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found or no changes made",
      });
    }
    res.json({
      success: true,
      message: "Membership plan updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
const deleteMembership = async (req, res, next) => {
  try {
    const active = await CustomerMemeberShip.count({
      where: {
        membership_id: req.params.id,
        status: "active",
      },
    });
    if (active > 0)
      return res.status(409).json({
        success: false,
        message: `Cannot delete — ${active} active subscriber(s)`,
      });
    const n = await CustomerMemeberShip.destroy({
      where: {
        membership_id: req.params.id,
        status: "active",
      },
    });
    if (!n) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }
    res.json({
      success: true,
      data: {
        message: "Plan deleted",
      },
    });
  } catch (error) {
    next(error);
  }
};
const getSubscribers = async (req, res, next) => {
  try {
    const sub = await CustomerMemeberShip.findAll({
      where: {
        membership_id: req.params.id,
      },
      include: [
        {
          association: "customer",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      order: [["end_date", "ASC"]],
    });
    res.json({
      success: true,
      data: sub,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
  getSubscribers,
};
