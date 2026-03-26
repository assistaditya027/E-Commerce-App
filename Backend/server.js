import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import configurePassport from './config/passport.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import newsletterRouter from './routes/newsletterRoute.js';
import {
  stripeWebhook,
  razorpayWebhook,
  autoCancelPendingOrders,
} from './controllers/orderController.js';
import passport from 'passport';

const app = express();
const port = process.env.PORT || 8000;

connectDB();
connectCloudinary();

// ── WEBHOOKS FIRST — must be before express.json() ───────────────────────────
app.post('/api/order/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhook);
app.post('/api/order/webhook/razorpay', express.raw({ type: 'application/json' }), razorpayWebhook);

// ── CORS ──────────────────────────────────────────────────────────────────────
const readOrigins = (val) =>
  String(val || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    ...readOrigins(process.env.CORS_ORIGINS),
    ...readOrigins(process.env.FRONTEND_URL),
    ...readOrigins(process.env.ADMIN_FRONTEND_URL),
  ]),
);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
configurePassport(passport);
app.use(passport.initialize());

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/newsletter', newsletterRouter);

app.get('/', (req, res) => res.json({ success: true, message: 'Clovo API is running' }));

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, _next) => {
  console.error('[server error]', err);
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ success: false, message: 'File too large. Max 5 MB per image.' });
  if (err.message?.startsWith('Unsupported file type'))
    return res.status(400).json({ success: false, message: err.message });
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

app.listen(port, () => console.log(`✓ Server running on port ${port}`));

if (process.env.NODE_ENV !== 'test') {
  const sweepMinutes = Number(process.env.PAYMENT_PENDING_SWEEP_MINUTES) || 5;
  autoCancelPendingOrders().catch((e) => console.error('[auto-cancel]', e));
  setInterval(
    () => autoCancelPendingOrders().catch((e) => console.error('[auto-cancel]', e)),
    sweepMinutes * 60 * 1000,
  );
}
