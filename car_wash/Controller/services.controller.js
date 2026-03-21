const ServiceConsumption = require("../Models/serviceConsumption.model");
const Service = require("../Models/service.model");
const InventoryItem = require("../Models/inventoryItem.model");
const getAll = async (req, res, next) => {
  try {
    const where =
      req.query.active === "true"
        ? {
            is_active: true,
          }
        : {};
    const rows = await Service.findAll({
      where,
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [
        {
          model: ServiceConsumption,
          as: "consumptionRules",
          include: [
            {
              model: InventoryItem,
              as: "item",
              attributes: ["id", "name", "unit"],
            },
          ],
        },
      ],
    });
    if (!service)
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });

    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, vehicle_type, price, duration_mins } = req.body;
    const s = await Service.create({
      name,
      vehicle_type: vehicle_type || "all",
      price,
      duration_mins: duration_mins || 30,
    });
    res.status(201).json({
      success: true,
      data: {
        message: "Service created",
        id: s.id,
      },
    });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, vehicle_type, price, duration_mins } = req.body;
    const [n] = await Service.update(
      {
        name,
        vehicle_type,
        price,
        duration_mins,
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
        .json({ success: false, message: "Service not found" });

    res.json({
      success: true,
      data: {
        message: "Service updated",
      },
    });
  } catch (err) {
    next(err);
  }
};

const toggle = async (req, res, next) => {
  try {
    const s = await Service.findByPk(req.params.id);
    if (!s)
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });

    await s.update({
      is_active: !s.is_active,
    });
    res.json({
      success: true,
      data: {
        message: `Service ${s.is_active ? "activated" : "deactivated"}`,
      },
    });
  } catch (err) {
    next(err);
  }
};
const getConsumption = async (req, res, next) => {
  try {
    const rows = await ServiceConsumption.findAll({
      where: {
        service_id: req.params.id,
      },
      include: [
        {
          model: InventoryItem,
          as: "item",
          attributes: ["id", "name", "unit", "cost_per_unit"],
        },
      ],
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const addConsumption = async (req, res, next) => {
  try {
    const { item_id, qty_per_service } = req.body;
    const item = await InventoryItem.findByPk(item_id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Inventory item not found" });

    const [row, created] = await ServiceConsumption.findOrCreate({
      where: {
        service_id: req.params.id,
        item_id,
      },
      defaults: {
        qty_per_service,
      },
    });
    if (!created) await row.update({ qty_per_service });

    res.status(201).json({
      success: true,
      data: {
        message: "Consumption rule saved",
        id: row.id,
      },
    });
  } catch (err) {
    next(err);
  }
};
const updateConsumption = async (req, res, next) => {
  try {
    const [n] = await ServiceConsumption.update(
      {
        qty_per_service: req.body.qty_per_service,
      },
      {
        where: {
          id: req.params.consumptionId,
          service_id: req.params.id,
        },
      },
    );
    if (!n)
      return res
        .status(404)
        .json({ success: false, message: "Consumption rule not found" });

    res.json({
      success: true,
      data: {
        message: "Consumption rule updated",
      },
    });
  } catch (err) {
    next(err);
  }
};

const deleteConsumption = async (req, res, next) => {
  try {
    const n = await ServiceConsumption.destroy({
      where: {
        id: req.params.consumptionId,
        service_id: req.params.id,
      },
    });
    if (!n)
      return res
        .status(404)
        .json({ success: false, message: "Consumption rule not found" });

    res.json({
      success: true,
      data: {
        message: "Consumption rule deleted",
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  toggle,
  getConsumption,
  addConsumption,
  updateConsumption,
  deleteConsumption,
};
