import express from 'express';
import {
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  allOrders,
  userOrders,
  getOrder,
  updateStatus,
  verifyStripe,
  verifyRazorpay,
  stripeWebhook,
  razorpayWebhook,
} from '../controllers/orderController.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';

const orderRouter = express.Router();

// Admin
orderRouter.post('/list', adminAuth, allOrders);
orderRouter.post('/single', adminAuth, getOrder);
orderRouter.get('/single/:orderId', adminAuth, getOrder);
orderRouter.get('/single', adminAuth, getOrder);
orderRouter.post('/status', adminAuth, updateStatus);

// Place orders
orderRouter.post('/place', authUser, placeOrder);
orderRouter.post('/stripe', authUser, placeOrderStripe);
orderRouter.post('/razorpay', authUser, placeOrderRazorpay);

// User orders
orderRouter.post('/userorders', authUser, userOrders);

// Verify
orderRouter.post('/verifyStripe', authUser, verifyStripe);
orderRouter.post('/verifyRazorpay', authUser, verifyRazorpay);

// Webhooks (no auth - called by payment gateways)
orderRouter.post('/stripeWebhook', stripeWebhook);
orderRouter.post('/razorpayWebhook', razorpayWebhook);

export default orderRouter;
