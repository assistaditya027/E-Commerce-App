const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const isPositiveNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
};

const isNonEmptyArray = (value) => Array.isArray(value) && value.length > 0;

const getItemProductId = (item) => item?._id || item?.productId;

export const validateOrderRequest = ({ items, address }) => {
  if (!isNonEmptyArray(items)) return 'items is required';
  if (!address || typeof address !== 'object') return 'address is required';

  const stringFields = ['firstName', 'lastName', 'street', 'city', 'state', 'country'];
  for (const field of stringFields) {
    if (!isNonEmptyString(String(address[field] ?? ''))) return `address.${field} is required`;
  }

  // zipcode and phone can arrive as number (type="number" input) or string
  const flexFields = ['zipcode', 'phone'];
  for (const field of flexFields) {
    const val = address[field];
    const ok =
      (typeof val === 'string' && val.trim().length > 0) ||
      (typeof val === 'number' && Number.isFinite(val));
    if (!ok) return `address.${field} is required`;
  }

  const invalidItem = items.find(
    (item) =>
      !item ||
      !isNonEmptyString(String(getItemProductId(item) ?? '')) ||
      !isPositiveNumber(item.quantity) ||
      !isNonEmptyString(item.size), // ✅ size is now required
  );
  if (invalidItem) return 'items must include productId/_id, size, and quantity';

  return null;
};

export const validateStripeVerifyRequest = ({ orderId }) => {
  if (!isNonEmptyString(orderId)) return 'orderId is required';
  return null;
};

export const validateRazorpayVerifyRequest = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  if (!isNonEmptyString(razorpay_order_id)) return 'razorpay_order_id is required';
  if (!isNonEmptyString(razorpay_payment_id)) return 'razorpay_payment_id is required';
  if (!isNonEmptyString(razorpay_signature)) return 'razorpay_signature is required';
  return null;
};

export const validateStockItems = (items) => {
  if (!isNonEmptyArray(items)) return 'items is required';
  const invalidItem = items.find(
    (item) =>
      !item ||
      !isNonEmptyString(String(getItemProductId(item) ?? '')) ||
      !isPositiveNumber(item.quantity),
  );
  if (invalidItem) return 'items must include productId/_id and quantity';
  return null;
};

export const getProductIdFromItem = getItemProductId;
