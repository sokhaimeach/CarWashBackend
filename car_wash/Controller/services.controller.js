// start Service

const Service = require("../Models/service.model");
const ServiceConsumption = require("../Models/serviceConsumption.model");
const InventoryItem = require("../Models/inventoryItem.model");

// getservice
const getService = async (req, res, next) => {
  try {
    const where = req.query.active === "true" ? {} : {};
    const serviceData = await Service.findAll({
      where,
      order: [["name", "ASC"]],
    });
    if (serviceData <= 0) {
      return res
        .status(202)
        .json({ success: true, message: "service Not Have!!!" });
    }
    res.status(200).json({ success: true, data: serviceData });
  } catch (error) {
    next(error);
  }
};
// get one Service
const getOneService = async (req, res, next) => {
  try {
    const getOnedata = await Service.findByPk(req.params.id, {
      include: [
        {
          model: ServiceConsumption,
          as: "consumptionRules",
          include: [
            {
              model: InventoryItem,
              as: "items",
              attributes: ["id", "name", "unit"],
            },
          ],
        },
      ],
    });
    if (!getOnedata) {
      return res.status(404).json({
        success: false,
        message: "service Not Founded!",
      });
    }
  } catch (error) {
    next(error);
  }
};
// create service
const crateService = async (req, res, next) => {
  try {
    const { name, vehicle_type, price, duration_mins } = req.body;
    const sCreate = await Service.create({
      name,
      vehicle_type: vehicle_type || "all",
      price,
      duration_mins: duration_mins || 30,
    });
    res.status(200).json({
      success: true,
      data: {
        message: "Create Service Successfullt",
        id: sCreate.id,
      },
    });
  } catch (error) {
    next(error);
  }
};
// update Service
const updateService = async (req, res, next) => {
  try {
    const { name, vehicle_type, price, duration_mins } = req.body;
    const [u] = await Service.update(
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
    if (!u) {
      return res.status(404).json({
        success: false,
        message: "service Not Founded!!",
      });
    }
    res.status(200).json({
      success: true,
      data: { messgae: "Service Update Successful" },
    });
  } catch (error) {
    next(error);
  }
};
// toggle
const toggle = async (req, res, next) => {
  try {
    const s = await Service.findByPk(req.params.id);
    if (!s) {
      return res.status(404).json({
        success: false,
        messgae: "Service Not Found",
      });
    }
    await s.update({
      is_active: !s.is_active,
    });
    res.status(200).json({
      success: true,
      data: {
        message: `Service ${s.is_active ? "activated" : "deactivated"}`,
      },
    });
  } catch (error) {
    next(error);
  }
};
// get Consumption
const getConsumption = async (req, res, next) => {
  try {
    const rows = await ServiceConsumption.findAll({
      where: {
        service_id: req.params.id,
      },
      include: [
        {
          model: InventoryItem,
          as: "Items",
          attributes: ["id", "name", "unit", "cost_per_unit"],
        },
      ],
    });
    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};
// addConsumption
const addConsumption = async (req, res, next) => {
  try {
    const { item_id, qty_per_service } = req.body;
    const itmes = await InventoryItem.findByPk(req.params.id);
    if (!itmes) {
      return res.status(404).json({
        success: false,
        message: "Inventory Not Founded!",
      });
    }
    const [row, createCon] = await ServiceConsumption.findOrCreate({
      where: {
        service_id: req.params.id,
        item_id,
      },
      defaults: {
        qty_per_service,
      },
    });
    if (!createCon) {
      await row.update({ qty_per_service });
    }
    res.status(200).json({
      success: true,
      data: {
        message: "Concumption Rule Created",
        id: row.id,
      },
    });
  } catch (error) {
    next(error);
  }
};
// Update Comsumption
const updateConsumption = async (req, res, next) => {
  try {
    const [n] = await ServiceConsumption.update(
      {
        qty_per_service: req.body.qty_per_service,
      },
      {
        where: {
          id: params.consumptionId,
          service_id: req.params.id,
        },
      },
    );
    if (!n) {
      return res.status(404).json({
        success: false,
        message: "consumption rule not found",
      });
    }
    res.status(200).json({
      success: true,
      data: {
        messgae: "Consumption Updated!",
      },
    });
  } catch (error) {
    next(error);
  }
};
// deleted consumption
const deleteConsumption = async (req, res, next) => {
  try {
    const [d] = await ServiceConsumption.destroy({
      where: {
        id: req.params.consumptionId,
        service_id: req.params.id,
      },
    });
    if (!d) {
      return res.status(404).json({
        success: false,
        message: "Consumption Not found",
      });
    }
    res.status(200).json({
      success: true,
      data: {
        messgae: "Consumption Updated Successful",
      },
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getService,
  getOneService,
  crateService,
  updateService,
  toggle,
  getConsumption,
  addConsumption,
  updateConsumption,
  deleteConsumption,
};
