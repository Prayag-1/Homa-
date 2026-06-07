const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'wishlist',
      'name price images brand slug isActive ratings comparePrice'
    );

    // Filter out inactive products
    const filteredWishlist = user.wishlist.filter((product) => product.isActive);

    return res.json({
      success: true,
      data: filteredWishlist,
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ApiError(404, 'Product not found'));
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    const isInWishlist = req.user.wishlist.some((id) => id.toString() === productId);

    if (isInWishlist) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { wishlist: productId },
      });
      return res.json({ success: true, data: { action: 'removed' } });
    } else {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { wishlist: productId },
      });
      return res.json({ success: true, data: { action: 'added' } });
    }
  } catch (err) {
    next(err);
  }
};
