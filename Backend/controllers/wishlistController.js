import userModel from '../models/userModel.js';
import { logError, logInfo } from '../utils/logger.js';

// Add product to user wishlist
const addToWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

    const userData = await userModel.findById(userId);
    let wishlist = userData.wishlist || [];

    // Check if product already in wishlist
    if (wishlist.includes(productId)) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }

    wishlist.push(productId);

    await userModel.findByIdAndUpdate(userId, { wishlist });

    logInfo('wishlist.add', { userId, productId });
    res.json({ success: true, message: 'Added to Wishlist', wishlist });
  } catch (error) {
    logError('wishlist.add.error', { message: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove product from user wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

    const userData = await userModel.findById(userId);
    let wishlist = userData.wishlist || [];

    wishlist = wishlist.filter((id) => id !== productId);

    await userModel.findByIdAndUpdate(userId, { wishlist });

    logInfo('wishlist.remove', { userId, productId });
    res.json({ success: true, message: 'Removed from Wishlist', wishlist });
  } catch (error) {
    logError('wishlist.remove.error', { message: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle product in/out of wishlist
const toggleWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

    const userData = await userModel.findById(userId);
    let wishlist = userData.wishlist || [];

    if (wishlist.includes(productId)) {
      wishlist = wishlist.filter((id) => id !== productId);
      logInfo('wishlist.remove', { userId, productId });
      res.json({ success: true, message: 'Removed from Wishlist', wishlist, isWishlisted: false });
    } else {
      wishlist.push(productId);
      logInfo('wishlist.add', { userId, productId });
      res.json({ success: true, message: 'Added to Wishlist', wishlist, isWishlisted: true });
    }

    await userModel.findByIdAndUpdate(userId, { wishlist });
  } catch (error) {
    logError('wishlist.toggle.error', { message: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get user wishlist
const getUserWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });

    const userData = await userModel.findById(userId);
    const wishlist = userData.wishlist || [];

    logInfo('wishlist.get', { userId });
    res.json({ success: true, wishlist });
  } catch (error) {
    logError('wishlist.get.error', { message: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { addToWishlist, removeFromWishlist, toggleWishlist, getUserWishlist };
