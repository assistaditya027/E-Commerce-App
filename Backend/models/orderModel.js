import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  address: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'Order Placed',
  },
  statusHistory: [
    {
      status: { type: String, required: true },
      at: { type: Date, required: true },
      by: { type: String, required: true },
    },
  ],
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentGateway: {
    type: String,
  },
  paymentOrderId: {
    type: String,
  },
  paymentAmount: {
    type: Number,
    default: 0,
  },
  paymentCurrency: {
    type: String,
  },
  paymentId: {
    type: String,
  },
  paymentSignature: {
    type: String,
  },
  paymentUrl: {
    type: String,
  },
  idempotencyKey: {
    type: String,
  },
  payment: {
    type: Boolean,
    required: true,
    default: false,
  },
  date: {
    type: Date,
    required: true,
  },
});

orderSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string', $ne: '' } } },
);
orderSchema.index(
  { paymentOrderId: 1 },
  { unique: true, partialFilterExpression: { paymentOrderId: { $type: 'string', $ne: '' } } },
);

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);

export default orderModel;
