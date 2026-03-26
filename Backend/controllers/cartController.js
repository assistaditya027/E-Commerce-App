import userModel from '../models/userModel.js';
import { validateCartAdd, validateCartUpdate } from '../validation/cartValidation.js';
import { logError, logInfo } from '../utils/logger.js';

// Add products to user cart
const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId, size } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
    const validationError = validateCartAdd({ itemId, size });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const userData = await userModel.findById(userId);
    const cartData = await userData.cartData;

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }

    await userModel.findByIdAndUpdate(userId, { cartData });

    logInfo('cart.add', { userId, itemId, size });
    res.json({ success: true, message: 'Added To Cart' });
  } catch (error) {
    logError('cart.add.error', { message: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update user cart
const updateCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId, size, quantity } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
    const validationError = validateCartUpdate({ itemId, size, quantity });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const userData = await userModel.findById(userId);
    const cartData = await userData.cartData;

    cartData[itemId][size] = quantity;

    await userModel.findByIdAndUpdate(userId, { cartData });
    logInfo('cart.update', { userId, itemId, size, quantity });
    res.json({ success: true, message: 'Cart Updated' });
  } catch (error) {
    logError('cart.update.error', { message: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get user cart data
const getUserCart = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });

    const userData = await userModel.findById(userId);
    const cartData = await userData.cartData;

    logInfo('cart.get', { userId });
    res.json({ success: true, cartData });
  } catch (error) {
    logError('cart.get.error', { message: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart };
