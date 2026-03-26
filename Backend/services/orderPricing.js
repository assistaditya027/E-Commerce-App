import { getProductIdFromItem } from '../validation/orderValidation.js';

export const buildOrderItemsFromProducts = (items, productsById) => {
  return items.map((item) => {
    const productId = getProductIdFromItem(item);
    const product = productsById.get(String(productId));
    const image = Array.isArray(product.image)
      ? product.image
      : product.image
        ? [product.image]
        : [];
    return {
      productId: String(product._id),
      name: product.name,
      price: Number(product.price), // ✅ coerce
      quantity: Number(item.quantity), // ✅ coerce
      size: item.size || null,
      image,
    };
  });
};

export const calculateTotals = (orderItems, deliveryCharge) => {
  const subTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subTotal + deliveryCharge;
  return { subTotal, total };
};

export const buildStripeLineItems = (orderItems, deliveryCharge, currency) => {
  const lineItems = orderItems.map((item) => ({
    price_data: {
      currency,
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  lineItems.push({
    price_data: {
      currency,
      product_data: { name: 'Delivery Charges' },
      unit_amount: Math.round(deliveryCharge * 100),
    },
    quantity: 1,
  });

  return lineItems;
};
