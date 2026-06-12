const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { parseDateRange } = require('../utils/dateRange');

// GET /admin/reports/overview
const getSalesOverview = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { startDate, endDate } = parseDateRange(from, to);

    // Run aggregations in parallel for performance
    const [orders, revenue, customers, topProducts] = await Promise.all([
      // 1. Order counts by status in date range
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),

      // 2. Revenue totals (paid orders only)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'paid',
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$grandTotal' },
            totalVAT: { $sum: '$vatAmount' },
            totalOrders: { $sum: 1 },
            averageOrder: { $avg: '$grandTotal' },
            totalDelivery: { $sum: '$deliveryCharge' },
          },
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
            totalVAT: 1,
            totalOrders: 1,
            averageOrder: 1,
            totalDelivery: 1,
          },
        },
      ]),

      // 3. New customers in date range
      User.countDocuments({
        role: 'user',
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // 4. Top 5 selling products
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'paid',
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            unitsSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            unitsSold: 1,
            revenue: 1,
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        dateRange: { from: startDate, to: endDate },
        summary: {
          totalRevenue: revenue[0]?.totalRevenue || 0,
          totalVAT: revenue[0]?.totalVAT || 0,
          totalOrders: revenue[0]?.totalOrders || 0,
          averageOrder: revenue[0]?.averageOrder || 0,
          newCustomers: customers,
        },
        ordersByStatus: orders,
        topProducts,
      },
      message: 'Sales overview retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

// GET /admin/reports/daily
const getDailyRevenue = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { startDate, endDate } = parseDateRange(from, to);

    const dailyData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          revenue: 1,
          orders: 1,
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Transform result into readable format
    const transformedData = dailyData.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      revenue: item.revenue,
      orders: item.orders,
    }));

    res.json({
      success: true,
      data: transformedData,
      message: 'Daily revenue retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

// GET /admin/reports/by-category
const getCategoryRevenue = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { startDate, endDate } = parseDateRange(from, to);

    const categoryData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'paid',
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productData',
        },
      },
      {
        $unwind: { path: '$productData', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: '$productData.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          unitsSold: { $sum: '$items.quantity' },
        },
      },
      {
        $project: {
          _id: 1,
          revenue: 1,
          unitsSold: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({
      success: true,
      data: categoryData,
      message: 'Category revenue retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

// GET /admin/reports/payments
const getPaymentMethodStats = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { startDate, endDate } = parseDateRange(from, to);

    const paymentStats = await Order.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } },
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          revenue: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: paymentStats,
      message: 'Payment method statistics retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

// GET /admin/reports/export
const exportCSV = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { startDate, endDate } = parseDateRange(from, to);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="homa-orders-${Date.now()}.csv"`,
    );

    res.write(
      'Order ID,Date,Customer,Email,Items,Subtotal,VAT,Total,Payment,Status\n',
    );

    const cursor = Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate('user', 'name email')
      .cursor();

    for await (const order of cursor) {
      const row = [
        order._id,
        order.createdAt.toISOString().split('T')[0],
        order.user?.name || 'Guest',
        order.user?.email || '',
        order.items.length,
        order.subtotal,
        order.vatAmount,
        order.grandTotal,
        order.paymentMethod,
        order.orderStatus,
      ].join(',');
      res.write(row + '\n');
    }

    res.end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSalesOverview,
  getDailyRevenue,
  getCategoryRevenue,
  getPaymentMethodStats,
  exportCSV,
};
