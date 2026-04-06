import mongoose from 'mongoose';
import crypto from 'crypto';
import Stripe from 'stripe';
import razorpay from 'razorpay';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import productModel from '../models/productModel.js';
import { logInfo, logWarn, logError } from '../utils/logger.js';
import {
  validateOrderRequest,
  validateStripeVerifyRequest,
  validateRazorpayVerifyRequest,
  getProductIdFromItem,
} from '../validation/orderValidation.js';
import {
  buildOrderItemsFromProducts,
  calculateTotals,
  buildStripeLineItems,
} from '../services/orderPricing.js';
import { buildStatusEntry, appendStatusHistory } from '../services/orderLifecycle.js';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../services/emailService.js';

const currency = 'inr';
const deliveryChargeEnv = Number(process.env.DELIVERY_CHARGE);
const deliveryCharge = Number.isFinite(deliveryChargeEnv) ? deliveryChargeEnv : 10;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getIdempotencyKey = (req) => {
  const key = req.headers['idempotency-key'] || req.body?.idempotencyKey;
  return typeof key === 'string' ? key.trim() : '';
};

const loadProductsMap = async (items, session) => {
  const productIds = [...new Set(items.map(getProductIdFromItem).filter(Boolean).map(String))];
  const products = await productModel
    .find({ _id: { $in: productIds }, published: true })
    .session(session);
  const productsById = new Map(products.map((product) => [String(product._id), product]));
  return { productsById, productIds };
};

const reserveStock = async (items, productsById, session) => {
  for (const item of items) {
    const productId = String(getProductIdFromItem(item));
    const product = productsById.get(productId);
    const quantity = Number(item.quantity);
    const size = item.size;

    if (!product)
      throw Object.assign(new Error(`Product not found: ${productId}`), {
        code: 'PRODUCT_UNAVAILABLE',
      });
    if (!size || typeof size !== 'string' || !size.trim())
      throw Object.assign(new Error(`Size is required for ${product.name}`), {
        code: 'INVALID_SIZE',
      });
    if (!Number.isFinite(quantity) || quantity <= 0)
      throw Object.assign(new Error(`Invalid quantity for ${product.name}`), {
        code: 'INVALID_QUANTITY',
      });

    const sizeStock =
      product.stock instanceof Map ? product.stock.get(size) : product.stock?.[size];

    if (sizeStock === undefined || sizeStock === null)
      throw Object.assign(new Error(`Size ${size} is not available for ${product.name}`), {
        code: 'OUT_OF_STOCK',
      });
    if (sizeStock < quantity)
      throw Object.assign(new Error(`Insufficient stock for ${product.name} (${size})`), {
        code: 'OUT_OF_STOCK',
      });

    const updated = await productModel.updateOne(
      { _id: product._id, [`stock.${size}`]: { $gte: quantity } },
      { $inc: { [`stock.${size}`]: -quantity } },
      { session },
    );
    if (updated.modifiedCount !== 1)
      throw Object.assign(new Error(`Insufficient stock for ${product.name} (${size})`), {
        code: 'OUT_OF_STOCK',
      });
  }
};

const restockItems = async (orderItems) => {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return;
  const ops = orderItems.map((item) => ({
    updateOne: {
      filter: { _id: item.productId },
      update: { $inc: { [`stock.${item.size}`]: item.quantity } },
    },
  }));
  await productModel.bulkWrite(ops);
};

const autoCancelPendingOrders = async () => {
  const ttlMinutes = Number(process.env.PAYMENT_PENDING_TTL_MINUTES) || 30;
  const threshold = new Date(Date.now() - ttlMinutes * 60 * 1000);

  const pendingOrders = await orderModel.find({
    status: 'Payment Pending',
    payment: false,
    date: { $lt: threshold },
  });

  for (const order of pendingOrders) {
    const updated = await orderModel.findOneAndUpdate(
      { _id: order._id, status: 'Payment Pending', payment: false },
      {
        $set: { payment: false, status: 'Cancelled' },
        $push: { statusHistory: buildStatusEntry('Cancelled', 'system') },
      },
      { new: true },
    );
    if (updated) {
      await restockItems(order.items);
      logInfo('order.pending.auto_cancel', { orderId: order._id });
    }
  }
};

// ── COD ───────────────────────────────────────────────────────────────────────
const placeOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;
    const idempotencyKey = getIdempotencyKey(req);

    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
    const validationError = validateOrderRequest({ items, address });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    if (idempotencyKey) {
      const existing = await orderModel.findOne({ userId, idempotencyKey });
      if (existing) return res.json({ success: true, orderId: existing._id, order: existing });
    }

    const session = await mongoose.startSession();
    let createdOrder = null;

    try {
      await session.withTransaction(async () => {
        const { productsById, productIds } = await loadProductsMap(items, session);
        if (productsById.size !== productIds.length)
          throw Object.assign(new Error('Some products are unavailable'), {
            code: 'PRODUCT_UNAVAILABLE',
          });

        await reserveStock(items, productsById, session);
        const orderItems = buildOrderItemsFromProducts(items, productsById);
        const { total } = calculateTotals(orderItems, deliveryCharge);

        const now = new Date();
        const [doc] = await orderModel.create(
          [
            {
              userId,
              items: orderItems,
              address,
              amount: total,
              paymentMethod: 'COD',
              paymentGateway: 'COD',
              payment: false,
              date: now,
              status: 'Order Placed',
              statusHistory: [buildStatusEntry('Order Placed', 'system', now)],
              idempotencyKey: idempotencyKey || undefined,
            },
          ],
          { session },
        );
        createdOrder = doc;
        await userModel.findByIdAndUpdate(userId, { cartData: {} }, { session });
      });

      logInfo('order.cod.created', { orderId: createdOrder?._id, userId });
      
      // Send confirmation email
      try {
        const user = await userModel.findById(userId).select('email name');
        if (user && createdOrder) {
          const orderDetails = {
            orderId: createdOrder._id,
            customerName: user.name,
            items: createdOrder.items.map((item) => ({
              name: item.name,
              size: item.size,
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal: createdOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            deliveryCharge: deliveryCharge,
            tax: 0,
            total: createdOrder.amount,
            paymentMethod: 'Cash on Delivery',
          };
          await sendOrderConfirmation(user.email, orderDetails);
          logInfo('order.confirmation.email.sent', { orderId: createdOrder._id, email: user.email });
        } else {
          logWarn('order.confirmation.email.skip', { reason: 'user_or_order_missing' });
        }
      } catch (emailError) {
        logWarn('order.confirmation.email.failed', { error: emailError.message });
      }
      
      return res
        .status(201)
        .json({ success: true, orderId: createdOrder?._id, order: createdOrder });
    } catch (error) {
      if (error?.code === 11000 && idempotencyKey) {
        const existing = await orderModel.findOne({ userId, idempotencyKey });
        if (existing) return res.json({ success: true, orderId: existing._id, order: existing });
      }
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    if (error?.code === 'OUT_OF_STOCK')
      return res.status(409).json({ success: false, message: error.message });
    if (error?.code === 'PRODUCT_UNAVAILABLE')
      return res.status(400).json({ success: false, message: error.message });
    if (error?.code === 'INVALID_SIZE')
      return res.status(400).json({ success: false, message: error.message });
    if (error?.code === 'INVALID_QUANTITY')
      return res.status(400).json({ success: false, message: error.message });
    logError('order.cod.error', { message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── STRIPE ────────────────────────────────────────────────────────────────────
const placeOrderStripe = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;
    const { origin } = req.headers;
    const idempotencyKey = getIdempotencyKey(req);

    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (!origin)
      return res.status(400).json({ success: false, message: 'origin header is required' });
    const validationError = validateOrderRequest({ items, address });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    if (idempotencyKey) {
      const existing = await orderModel.findOne({ userId, idempotencyKey });
      if (existing)
        return res.json({
          success: true,
          session_url: existing.paymentUrl,
          orderId: existing._id,
          order: existing,
        });
    }

    const sessionDb = await mongoose.startSession();
    let createdOrder = null;
    let orderItems = null;

    try {
      await sessionDb.withTransaction(async () => {
        const { productsById, productIds } = await loadProductsMap(items, sessionDb);
        if (productsById.size !== productIds.length)
          throw Object.assign(new Error('Some products are unavailable'), {
            code: 'PRODUCT_UNAVAILABLE',
          });

        await reserveStock(items, productsById, sessionDb);
        orderItems = buildOrderItemsFromProducts(items, productsById);
        const { total } = calculateTotals(orderItems, deliveryCharge);

        const now = new Date();
        const [doc] = await orderModel.create(
          [
            {
              userId,
              items: orderItems,
              address,
              amount: total,
              paymentMethod: 'Stripe',
              paymentGateway: 'Stripe',
              payment: false,
              date: now,
              status: 'Payment Pending',
              statusHistory: [buildStatusEntry('Payment Pending', 'system', now)],
              idempotencyKey: idempotencyKey || undefined,
            },
          ],
          { session: sessionDb },
        );
        createdOrder = doc;
      });
    } catch (error) {
      if (error?.code === 11000 && idempotencyKey) {
        const existing = await orderModel.findOne({ userId, idempotencyKey });
        if (existing)
          return res.json({
            success: true,
            session_url: existing.paymentUrl,
            orderId: existing._id,
            order: existing,
          });
      }
      throw error;
    } finally {
      sessionDb.endSession();
    }

    try {
      const line_items = buildStripeLineItems(orderItems, deliveryCharge, currency);
      const stripeSession = await stripe.checkout.sessions.create(
        {
          success_url: `${origin}/verify?success=true&orderId=${createdOrder._id}`,
          cancel_url: `${origin}/verify?success=false&orderId=${createdOrder._id}`,
          line_items,
          mode: 'payment',
          metadata: { orderId: createdOrder._id.toString(), userId },
        },
        idempotencyKey ? { idempotencyKey } : undefined,
      );

      // ✅ Save paymentOrderId and wait before responding
      await orderModel.findByIdAndUpdate(createdOrder._id, {
        $set: {
          paymentOrderId: stripeSession.id,
          paymentUrl: stripeSession.url,
          paymentAmount: Math.round(createdOrder.amount * 100),
          paymentCurrency: currency.toUpperCase(),
        },
      });

      logInfo('order.stripe.created', {
        orderId: createdOrder._id,
        userId,
        sessionId: stripeSession.id,
      });
      res
        .status(201)
        .json({ success: true, session_url: stripeSession.url, orderId: createdOrder._id });
    } catch (error) {
      logError('order.stripe.session.error', {
        message: error.message,
        orderId: createdOrder?._id,
      });
      if (createdOrder) {
        await orderModel.findByIdAndUpdate(createdOrder._id, {
          $set: { status: 'Cancelled', payment: false },
          $push: { statusHistory: buildStatusEntry('Cancelled', 'system') },
        });
        await restockItems(createdOrder.items || orderItems);
      }
      res.status(500).json({ success: false, message: error.message });
    }
  } catch (error) {
    if (error?.code === 'OUT_OF_STOCK')
      return res.status(409).json({ success: false, message: error.message });
    if (error?.code === 'PRODUCT_UNAVAILABLE')
      return res.status(400).json({ success: false, message: error.message });
    if (error?.code === 'INVALID_SIZE')
      return res.status(400).json({ success: false, message: error.message });
    if (error?.code === 'INVALID_QUANTITY')
      return res.status(400).json({ success: false, message: error.message });
    logError('order.stripe.error', { message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── VERIFY STRIPE ─────────────────────────────────────────────────────────────
const verifyStripe = async (req, res) => {
  const userId = req.userId;
  const { orderId, success } = req.body;

  try {
    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
    const validationError = validateStripeVerifyRequest({ orderId });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const order = await orderModel.findOne({ _id: orderId, userId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Already confirmed
    if (order.payment) return res.json({ success: true, status: order.status, payment: true });

    // User cancelled
    const isSuccess = success === 'true' || success === true;
    if (!isSuccess) {
      if (order.status !== 'Cancelled') {
        await orderModel.findByIdAndUpdate(orderId, {
          $set: { payment: false, status: 'Cancelled' },
          $push: { statusHistory: buildStatusEntry('Cancelled', 'system') },
        });
        await restockItems(order.items);
      }
      return res
        .status(400)
        .json({ success: false, message: 'Payment cancelled', status: 'Cancelled' });
    }

    // ✅ paymentOrderId not saved yet — wait and retry once
    let paymentOrderId = order.paymentOrderId;
    if (!paymentOrderId) {
      await new Promise((r) => setTimeout(r, 1500));
      const fresh = await orderModel.findOne({ _id: orderId, userId });
      if (fresh?.payment) return res.json({ success: true, status: fresh.status, payment: true });
      paymentOrderId = fresh?.paymentOrderId;
    }

    if (!paymentOrderId)
      return res.status(202).json({
        success: false,
        status: order.status,
        payment: false,
        message: 'Payment processing',
      });

    // ✅ Verify directly with Stripe — don't rely on webhook for local dev
    try {
      const stripeSession = await stripe.checkout.sessions.retrieve(paymentOrderId);

      if (stripeSession.payment_status === 'paid') {
        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, {
          $set: {
            payment: true,
            status: 'Order Placed',
            paymentId: stripeSession.payment_intent || '',
            paymentGateway: 'Stripe',
          },
          $push: { statusHistory: buildStatusEntry('Order Placed', 'system') },
        }, { new: true });
        
        await userModel.findByIdAndUpdate(userId, { cartData: {} });
        logInfo('order.stripe.verify.confirmed', { orderId, sessionId: paymentOrderId });
        
        // Send confirmation email
        try {
          const user = await userModel.findById(userId).select('email name');
          if (user && updatedOrder) {
            const orderDetails = {
              orderId: updatedOrder._id,
              customerName: user.name,
              items: updatedOrder.items.map((item) => ({
                name: item.name,
                size: item.size,
                quantity: item.quantity,
                price: item.price,
              })),
              subtotal: updatedOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
              deliveryCharge: deliveryCharge,
              tax: 0,
              total: updatedOrder.amount,
              paymentMethod: 'Stripe',
            };
            await sendOrderConfirmation(user.email, orderDetails);
            logInfo('order.confirmation.email.sent', { orderId: updatedOrder._id, email: user.email });
          } else {
            logWarn('order.confirmation.email.skip', { reason: 'user_or_order_missing' });
          }
        } catch (emailError) {
          logWarn('order.confirmation.email.failed', { error: emailError.message });
        }
        
        return res.json({ success: true, status: 'Order Placed', payment: true });
      }

      if (stripeSession.status === 'expired') {
        if (order.status !== 'Cancelled') {
          await orderModel.findByIdAndUpdate(orderId, {
            $set: { payment: false, status: 'Cancelled' },
            $push: { statusHistory: buildStatusEntry('Cancelled', 'system') },
          });
          await restockItems(order.items);
        }
        return res
          .status(400)
          .json({ success: false, message: 'Payment session expired', status: 'Cancelled' });
      }
    } catch (stripeErr) {
      logError('order.stripe.verify.fetch_failed', { message: stripeErr.message, orderId });
    }

    return res.status(202).json({
      success: false,
      status: order.status,
      payment: false,
      message: 'Payment processing',
    });
  } catch (error) {
    logError('order.stripe.verify.error', { message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── RAZORPAY ──────────────────────────────────────────────────────────────────
const placeOrderRazorpay = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;
    const idempotencyKey = getIdempotencyKey(req);

    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
    const validationError = validateOrderRequest({ items, address });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    if (idempotencyKey) {
      const existing = await orderModel.findOne({ userId, idempotencyKey });
      if (existing) {
        return res.json({
          success: true,
          order: {
            id: existing.paymentOrderId,
            amount: existing.paymentAmount,
            currency: existing.paymentCurrency || currency.toUpperCase(),
            receipt: existing._id.toString(),
          },
          orderId: existing._id,
        });
      }
    }

    const sessionDb = await mongoose.startSession();
    let createdOrder = null;
    let orderItems = null;

    try {
      await sessionDb.withTransaction(async () => {
        const { productsById, productIds } = await loadProductsMap(items, sessionDb);
        if (productsById.size !== productIds.length)
          throw Object.assign(new Error('Some products are unavailable'), {
            code: 'PRODUCT_UNAVAILABLE',
          });

        await reserveStock(items, productsById, sessionDb);
        orderItems = buildOrderItemsFromProducts(items, productsById);
        const { total } = calculateTotals(orderItems, deliveryCharge);

        const now = new Date();
        const [doc] = await orderModel.create(
          [
            {
              userId,
              items: orderItems,
              address,
              amount: total,
              paymentMethod: 'Razorpay',
              paymentGateway: 'Razorpay',
              payment: false,
              date: now,
              status: 'Payment Pending',
              statusHistory: [buildStatusEntry('Payment Pending', 'system', now)],
              idempotencyKey: idempotencyKey || undefined,
            },
          ],
          { session: sessionDb },
        );
        createdOrder = doc;
      });
    } catch (error) {
      if (error?.code === 11000 && idempotencyKey) {
        const existing = await orderModel.findOne({ userId, idempotencyKey });
        if (existing)
          return res.json({
            success: true,
            order: {
              id: existing.paymentOrderId,
              amount: existing.paymentAmount,
              currency: existing.paymentCurrency || currency.toUpperCase(),
              receipt: existing._id.toString(),
            },
            orderId: existing._id,
          });
      }
      throw error;
    } finally {
      sessionDb.endSession();
    }

    try {
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(createdOrder.amount * 100),
        currency: currency.toUpperCase(),
        receipt: createdOrder._id.toString(),
      });

      // ✅ Save and await before responding
      await orderModel.findByIdAndUpdate(createdOrder._id, {
        $set: {
          paymentOrderId: razorpayOrder.id,
          paymentAmount: razorpayOrder.amount,
          paymentCurrency: razorpayOrder.currency,
        },
      });

      logInfo('order.razorpay.created', {
        orderId: createdOrder._id,
        userId,
        razorpayOrderId: razorpayOrder.id,
      });
      res.status(201).json({ success: true, order: razorpayOrder, orderId: createdOrder._id });
    } catch (error) {
      logError('order.razorpay.order.error', {
        message: error.message,
        orderId: createdOrder?._id,
      });
      if (createdOrder) {
        await orderModel.findByIdAndUpdate(createdOrder._id, {
          $set: { status: 'Cancelled', payment: false },
          $push: { statusHistory: buildStatusEntry('Cancelled', 'system') },
        });
        await restockItems(createdOrder.items || orderItems);
      }
      res.status(500).json({ success: false, message: error.message });
    }
  } catch (error) {
    if (error?.code === 'OUT_OF_STOCK')
      return res.status(409).json({ success: false, message: error.message });
    if (error?.code === 'PRODUCT_UNAVAILABLE')
      return res.status(400).json({ success: false, message: error.message });
    if (error?.code === 'INVALID_SIZE')
      return res.status(400).json({ success: false, message: error.message });
    if (error?.code === 'INVALID_QUANTITY')
      return res.status(400).json({ success: false, message: error.message });
    logError('order.razorpay.error', { message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── VERIFY RAZORPAY ───────────────────────────────────────────────────────────
const verifyRazorpay = async (req, res) => {
  try {
    const userId = req.userId;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
    const validationError = validateRazorpayVerifyRequest({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    if (!process.env.RAZORPAY_KEY_SECRET)
      return res.status(500).json({ success: false, message: 'Razorpay secret is not configured' });

    // ✅ Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ success: false, message: 'Invalid Razorpay signature' });

    // ✅ Find by paymentOrderId OR by DB orderId as fallback
    let order = await orderModel.findOne({ userId, paymentOrderId: razorpay_order_id });
    if (!order && orderId) order = await orderModel.findOne({ _id: orderId, userId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status === 'Cancelled')
      return res
        .status(400)
        .json({ success: false, message: 'Order was cancelled', status: 'Cancelled' });

    // Already paid
    if (order.payment) return res.json({ success: true, status: order.status, payment: true });

    // ✅ Signature valid = payment confirmed — update immediately
    const updatedOrder = await orderModel.findByIdAndUpdate(order._id, {
      $set: {
        payment: true,
        status: 'Order Placed',
        paymentId: razorpay_payment_id,
        paymentOrderId: razorpay_order_id,
        paymentGateway: 'Razorpay',
      },
      $push: { statusHistory: buildStatusEntry('Order Placed', 'system') },
    }, { new: true });
    
    await userModel.findByIdAndUpdate(userId, { cartData: {} });
    logInfo('order.razorpay.verify.confirmed', { orderId: order._id, razorpay_order_id });

    // Send confirmation email
    try {
      const user = await userModel.findById(userId).select('email name');
      if (user && updatedOrder) {
        const orderDetails = {
          orderId: updatedOrder._id,
          customerName: user.name,
          items: updatedOrder.items.map((item) => ({
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: updatedOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          deliveryCharge: deliveryCharge,
          tax: 0,
          total: updatedOrder.amount,
          paymentMethod: 'Razorpay',
        };
        await sendOrderConfirmation(user.email, orderDetails);
        logInfo('order.confirmation.email.sent', { orderId: updatedOrder._id, email: user.email });
      } else {
        logWarn('order.confirmation.email.skip', { reason: 'user_or_order_missing' });
      }
    } catch (emailError) {
      logWarn('order.confirmation.email.failed', { error: emailError.message });
    }

    return res.json({ success: true, status: 'Order Placed', payment: true });
  } catch (error) {
    logError('order.razorpay.verify.error', { message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ALL ORDERS (Admin) ────────────────────────────────────────────────────────
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    logError('order.list.error', { message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── USER ORDERS ───────────────────────────────────────────────────────────────
const userOrders = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });
    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    logError('order.user.list.error', { message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── SINGLE ORDER (Admin) ──────────────────────────────────────────────────────
const getOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.query.orderId || req.body.orderId;
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });
    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    logError('order.get.error', { message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE STATUS (Admin) ─────────────────────────────────────────────────────
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status)
      return res.status(400).json({ success: false, message: 'orderId and status are required' });
    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === status) return res.json({ success: true, message: 'Status unchanged' });
    order.status = status;
    order.statusHistory = appendStatusHistory(
      order.statusHistory,
      status,
      req.adminEmail || 'admin',
    );
    await order.save();
    logInfo('order.status.updated', { orderId, status, by: req.adminEmail || 'admin' });
    
    // Send status update email
    try {
      const user = await userModel.findById(order.userId).select('email name');
      if (user) {
        await sendOrderStatusUpdate(user.email, user.name, orderId, status.toLowerCase());
        logInfo('order.status.email.sent', { orderId, status });
      } else {
        logWarn('order.status.email.skip', { reason: 'user_not_found' });
      }
    } catch (emailError) {
      logWarn('order.status.email.failed', { error: emailError.message });
    }
    
    res.json({ success: true, message: 'Status Updated' });
  } catch (error) {
    logError('order.status.update.error', { message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── STRIPE WEBHOOK ────────────────────────────────────────────────────────────
const stripeWebhook = async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logError('stripe.webhook.missing_secret');
    return res
      .status(500)
      .json({ success: false, message: 'Stripe webhook secret is not configured' });
  }

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logWarn('stripe.webhook.signature_failed', { message: error.message });
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    const data = event.data.object;

    if (event.type === 'checkout.session.completed') {
      const orderId = data.metadata?.orderId;
      const order = orderId
        ? await orderModel.findById(orderId)
        : await orderModel.findOne({ paymentOrderId: data.id });

      if (!order) {
        logWarn('stripe.webhook.order_missing', { sessionId: data.id, orderId });
        return res.json({ received: true });
      }

      if (!order.payment) {
        await orderModel.findByIdAndUpdate(order._id, {
          $set: {
            payment: true,
            status: 'Order Placed',
            paymentId: data.payment_intent || '',
            paymentOrderId: data.id,
            paymentGateway: 'Stripe',
          },
          $push: { statusHistory: buildStatusEntry('Order Placed', 'system') },
        });
        await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
        logInfo('stripe.webhook.paid', { orderId: order._id, sessionId: data.id });
      }
    }

    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const orderId = data.metadata?.orderId;
      const order = orderId
        ? await orderModel.findById(orderId)
        : await orderModel.findOne({ paymentOrderId: data.id });
      if (order && order.status !== 'Cancelled') {
        await orderModel.findByIdAndUpdate(order._id, {
          $set: { payment: false, status: 'Cancelled' },
          $push: { statusHistory: buildStatusEntry('Cancelled', 'system') },
        });
        await restockItems(order.items);
        logInfo('stripe.webhook.expired', { orderId: order._id, sessionId: data.id });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    logError('stripe.webhook.error', { message: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── RAZORPAY WEBHOOK ──────────────────────────────────────────────────────────
const razorpayWebhook = async (req, res) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    logError('razorpay.webhook.missing_secret');
    return res
      .status(500)
      .json({ success: false, message: 'Razorpay webhook secret is not configured' });
  }

  const signature = req.headers['x-razorpay-signature'];
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    logWarn('razorpay.webhook.signature_failed');
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  try {
    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payload?.payment?.entity;
      const orderEntity = payload?.payload?.order?.entity;
      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;

      let order = orderId ? await orderModel.findOne({ paymentOrderId: orderId }) : null;
      if (!order && orderId) {
        try {
          const rzpOrder = await razorpayInstance.orders.fetch(orderId);
          if (rzpOrder?.receipt) order = await orderModel.findById(rzpOrder.receipt);
        } catch (e) {
          logWarn('razorpay.webhook.order_fetch_failed', { orderId, message: e.message });
        }
      }
      if (!order) {
        logWarn('razorpay.webhook.order_missing', { orderId });
        return res.json({ received: true });
      }
      if (!order.payment) {
        await orderModel.findByIdAndUpdate(order._id, {
          $set: {
            payment: true,
            status: 'Order Placed',
            paymentId: paymentId || '',
            paymentGateway: 'Razorpay',
          },
          $push: { statusHistory: buildStatusEntry('Order Placed', 'system') },
        });
        await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
        logInfo('razorpay.webhook.paid', { orderId: order._id, razorpayOrderId: orderId });
      }
    }

    if (event === 'payment.failed') {
      const orderId = payload?.payload?.payment?.entity?.order_id;
      const order = orderId ? await orderModel.findOne({ paymentOrderId: orderId }) : null;
      if (order && order.status !== 'Cancelled') {
        await orderModel.findByIdAndUpdate(order._id, {
          $set: { payment: false, status: 'Cancelled' },
          $push: { statusHistory: buildStatusEntry('Cancelled', 'system') },
        });
        await restockItems(order.items);
        logInfo('razorpay.webhook.failed', { orderId: order._id, razorpayOrderId: orderId });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    logError('razorpay.webhook.error', { message: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
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
  autoCancelPendingOrders,
};
