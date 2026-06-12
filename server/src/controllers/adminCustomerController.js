const User = require('../models/User');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');

// GET /admin/customers
const getCustomers = async (req, res, next) => {
  try {
    const { search, membershipTier, isActive, hasOrders, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    // Enforce max limit
    const parsedLimit = Math.min(parseInt(limit) || 20, 50);
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // Build filter dynamically
    const filter = { role: 'user' };

    if (isActive && isActive !== 'all') {
      filter.isActive = isActive === 'true';
    }

    if (membershipTier) {
      filter.membershipTier = membershipTier;
    }

    if (search) {
      // Search on name only in list view (PII protection)
      filter.name = { $regex: search, $options: 'i' };
    }

    const safeSort = ['-createdAt', 'createdAt', 'name', '-name'].includes(sort) ? sort : '-createdAt';

    const [customerStats, customers, total] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: '$user',
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$grandTotal' },
            lastOrderAt: { $max: '$createdAt' },
          },
        },
      ]),
      User.find(filter)
        .select('_id name membershipTier loyaltyPoints isActive createdAt')
        .sort(safeSort)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Create a Map for O(1) lookup
    const statsMap = new Map(customerStats.map((stat) => [stat._id.toString(), stat]));

    // Filter by hasOrders if needed
    let filteredCustomers = customers;
    if (hasOrders && hasOrders !== 'all') {
      const hasOrdersFilter = hasOrders === 'yes';
      filteredCustomers = customers.filter((customer) => {
        const hasStats = statsMap.has(customer._id.toString());
        return hasOrdersFilter ? hasStats : !hasStats;
      });
    }

    // Enrich customers with order stats
    const enrichedCustomers = filteredCustomers.map((customer) => {
      const stats = statsMap.get(customer._id.toString());
      return {
        _id: customer._id,
        name: customer.name,
        membershipTier: customer.membershipTier,
        loyaltyPoints: customer.loyaltyPoints,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        orderCount: stats?.orderCount || 0,
        totalSpent: stats?.totalSpent || 0,
      };
    });

    res.json({
      success: true,
      data: {
        customers: enrichedCustomers,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      },
      message: 'Customers retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

// GET /admin/customers/:id
const getCustomer = async (req, res, next) => {
  try {
    const [customer, orders, wishlistCount] = await Promise.all([
      User.findById(req.params.id).select('-password'),
      Order.find({ user: req.params.id })
        .sort('-createdAt')
        .limit(10)
        .select('_id createdAt grandTotal orderStatus paymentMethod'),
      User.findById(req.params.id)
        .select('wishlist')
        .then((u) => u?.wishlist?.length || 0),
    ]);

    if (!customer || customer.role !== 'user') {
      return next(new ApiError(404, 'Customer not found'));
    }

    // Calculate order stats
    const orderStats = await Order.aggregate([
      { $match: { user: customer._id, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$grandTotal' },
        },
      },
    ]);

    const stats = orderStats[0] || { totalOrders: 0, totalSpent: 0 };

    res.json({
      success: true,
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        birthday: customer.birthday,
        address: customer.address,
        membershipTier: customer.membershipTier,
        loyaltyPoints: customer.loyaltyPoints,
        isActive: customer.isActive,
        isVerified: customer.isVerified,
        createdAt: customer.createdAt,
        orders,
        wishlistCount,
        stats: {
          totalOrders: stats.totalOrders,
          totalSpent: stats.totalSpent,
        },
      },
      message: 'Customer details retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /admin/customers/:id/toggle
const toggleCustomerActive = async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id);

    if (!customer) {
      return next(new ApiError(404, 'Customer not found'));
    }

    // SECURITY: Cannot deactivate an admin account through this endpoint
    if (customer.role === 'admin') {
      return next(
        new ApiError(
          403,
          'Cannot deactivate admin accounts through this endpoint',
        ),
      );
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    res.json({
      success: true,
      data: {
        _id: customer._id,
        name: customer.name,
        isActive: customer.isActive,
      },
      message: `Customer ${customer.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  toggleCustomerActive,
};
