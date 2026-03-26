import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOrderItemsFromProducts,
  calculateTotals,
  buildStripeLineItems,
} from '../services/orderPricing.js';
import { validateOrderRequest } from '../validation/orderValidation.js';
import { appendStatusHistory } from '../services/orderLifecycle.js';

test('buildOrderItemsFromProducts uses server prices', () => {
  const productsById = new Map([['p1', { _id: 'p1', name: 'Tee', price: 199, image: ['img1'] }]]);
  const items = [{ _id: 'p1', quantity: 2, size: 'M', price: 1 }];

  const orderItems = buildOrderItemsFromProducts(items, productsById);

  assert.equal(orderItems[0].price, 199);
  assert.equal(orderItems[0].quantity, 2);
  assert.equal(orderItems[0].size, 'M');
});

test('calculateTotals adds delivery charge', () => {
  const orderItems = [
    { price: 100, quantity: 1 },
    { price: 50, quantity: 2 },
  ];
  const { subTotal, total } = calculateTotals(orderItems, 10);

  assert.equal(subTotal, 200);
  assert.equal(total, 210);
});

test('buildStripeLineItems includes delivery', () => {
  const orderItems = [{ name: 'Tee', price: 100, quantity: 1 }];
  const lineItems = buildStripeLineItems(orderItems, 10, 'inr');

  assert.equal(lineItems.length, 2);
  assert.equal(lineItems[1].price_data.product_data.name, 'Delivery Charges');
});

test('validateOrderRequest requires address and items', () => {
  const error = validateOrderRequest({ items: [], address: null });
  assert.equal(error, 'items is required');
});

test('appendStatusHistory adds an entry', () => {
  const history = appendStatusHistory([], 'Order Placed', 'system');
  assert.equal(history.length, 1);
  assert.equal(history[0].status, 'Order Placed');
});
