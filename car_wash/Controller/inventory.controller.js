const { Supplier, InventoryItem, PurchaseOrder, PurchaseOrderItem, sequelize, StockTransaction } = require("../Models");
const { created, success, notFound, message, paginated } = require("../Middleware/response");
const { where, Op, col } = require("sequelize");

// ##############
// ## SUPPLIER ##
// ##############
const createSupplier = async (req, res, next) => {
  try {
    const { name, contact, lead_time_days } = req.body;

    const supplier = await Supplier.create({
      name,
      contact: contact || null,
      lead_time_days: lead_time_days || 0,
    });

    created(res, supplier);
  } catch (err) {
    next(err);
  }
};

const getSuppliers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { contact: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Supplier.findAndCountAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    paginated(res, rows, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    })
  } catch (err) {
    next(err);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, contact, lead_time_days } = req.body;
    
    const supplier = await Supplier.findByPk(id);
    if(!supplier) {
      return notFound(res, "Supplier not found");
    }

    Object.assign(supplier, { name, contact, lead_time_days });
    await supplier.save();

    success(res, supplier);
  } catch(err) {
    next(err);
  }
}

// #########
// # Items #
// #########
const getItems = async (req, res, next) => {
  try {
    const { search, filter, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { unit: { [Op.like]: `%${search.trim()}%` } }
      ];
    }
    if (filter) {
      whereClause.unit = { [Op.like]: `%${filter.trim()}%` };
    }

    const { count, rows } = await InventoryItem.findAndCountAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    paginated(res, rows, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    })
  } catch (err) {
    next(err);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const lowStockItems = await InventoryItem.findAll({
      where: {current_stock: {[Op.lte]: col("reorder_level")}},
      order: [[sequelize.literal('reorder_level - current_stock'), 'DESC']]
    });
    if(lowStockItems.length === 0) {
      return notFound(res, "No low stock item found");
    }

    success(res, lowStockItems);
  } catch(err) {
    next(err);
  }
}

const createItem = async (req, res, next) => {
  try {
    const { name, unit, current_stock, recorder_level, cost_per_unit } =
      req.body;
    const item = await InventoryItem.create({
      name,
      unit,
      current_stock,
      recorder_level,
      cost_per_unit,
    });

    created(res, item);
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, unit, current_stock, recorder_level, cost_per_unit } =
      req.body;

    const item = await InventoryItem.findByPk(id);
    if (!item) {
      return notFound(res);
    }

    Object.assign(item, {
      name,
      unit,
      current_stock,
      recorder_level,
      cost_per_unit,
    });
    await item.save();

    success(res, item);
  } catch (err) {
    next(err);
  }
};

// get stock history by items id
const getStockHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const stocks = await StockTransaction.findAll({
      where: {item_id: id},
      order: [["created_at", "DESC"]]
    });
    if(stocks.length === 0) {
      return notFound(res, "no stock found");
    }

    success(res, stocks);
  } catch(err) {
    next(err);
  }
}

// ##################
// # Purchase Order #
// ##################
const getPurchaseOrders = async (req, res, next) => {
  try {
    const { search, filterStatus, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const searchClause = {};
    if(search) {
      searchClause.name = {[Op.like]: `%${search}%`}
    }
    const where = {};
    if(filterStatus) {
      where.status = filterStatus;
    }

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      include: [
        {
          model: Supplier,
          as: 'supplier',
          where: searchClause
        },
        {
          model: PurchaseOrderItem,
          as: 'items'
        }
      ],
      where,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    paginated(res, rows, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    })
  } catch(err) {
    next(err);
  }
}

const createPurchaseOrder = async (req, res, next) => {
  let t;
  try {
    t = await sequelize.transaction();
    const {supplier_id, status = 'pending', items } = req.body;

    const purchaseOrder = await PurchaseOrder.create({supplier_id, status}, {transaction: t});
    const orderItemsData = items.map(item => ({ ...item, po_id: purchaseOrder.id }));
    const orderItems = await PurchaseOrderItem.bulkCreate(orderItemsData, {transaction: t});

    await t.commit();
    created(res, { purchaseOrder, orderItems });
  } catch(err) {
    if (t) await t.rollback();
    next(err);
  }
}

const receivePurchaseOrder = async (req, res, next) => {
  let t;
  try {
    t = await sequelize.transaction();
    const { id } = req.params;
    const { note = null } = req.body;

    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if(!purchaseOrder) {
      return notFound(res, "order not found");
    }
    if(purchaseOrder.status === "received"){
      return message(res, "this order has been received", 401);
    }
    if(purchaseOrder.status === "cancelled"){
      return message(res, "this order has been cancelled", 401);
    }

    const orderItems = await PurchaseOrderItem.findAll({where: {po_id: id}});
    if(orderItems.length <= 0) {
      return notFound(res, "no order items found");
    }
    const stockItems = orderItems.map(item => ({item_id: item.item_id, type: "in", qty: item.qty, reference_id: null, note}));

    // update purchaseOrder to received and create stock transaction
    purchaseOrder.status = "received";
    purchaseOrder.received_at = new Date();
    await purchaseOrder.save({transaction: t});
    await StockTransaction.bulkCreate(stockItems, {transaction: t});

    // Update inventory stock levels
    for (const item of orderItems) {
      const inventoryItem = await InventoryItem.findByPk(item.item_id, { transaction: t });
      if (inventoryItem) {
        inventoryItem.current_stock = parseFloat(inventoryItem.current_stock || 0) + parseFloat(item.qty);
        await inventoryItem.save({ transaction: t });
      }
    }

    await t.commit();
    message(res, "updated purchase order to received, created stock transaction and update inventory current stock");
  } catch(err) {
    if(t) await t.rollback();
    next(err);
  }
}

const cancelPurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if(!purchaseOrder) {
      return notFound(res, "Order not found");
    }
    if (purchaseOrder.status !== "pending") {
      return message(res, "Only pending orders can be cancelled", 400);
    }

    purchaseOrder.status = "cancelled";
    await purchaseOrder.save();

    success(res, purchaseOrder);
  } catch(err) {
    next(err);
  }
}

module.exports = {
  createSupplier,
  getSuppliers,
  updateSupplier,
  getItems,
  getLowStock,
  createItem,
  updateItem,
  getStockHistory,
  getPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder
};