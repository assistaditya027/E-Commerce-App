import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';

const CartTotal = () => {
  const { currency, delivery_fee, getCartAmount } = useContext(ShopContext);

  const subtotal = getCartAmount();
  const shipping = subtotal === 0 ? 0 : delivery_fee;
  const total = subtotal === 0 ? 0 : subtotal + delivery_fee;

  const fmt = (amount) => Number(amount).toFixed(2);

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="text-lg font-medium">
          <Title text1={'ORDER'} text2={'SUMMARY'} />
        </div>
      </div>

      {/* Line Items */}
      <div className="px-6 py-5 space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span className="text-gray-900 dark:text-gray-100 tabular-nums">
            {currency}
            {fmt(subtotal)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span>Shipping</span>
            {subtotal === 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-600">(add items)</span>
            )}
            {subtotal > 0 && delivery_fee === 0 && (
              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                FREE
              </span>
            )}
          </div>
          <span className="text-gray-900 dark:text-gray-100 tabular-nums">
            {subtotal > 0 && delivery_fee === 0 ? '—' : `${currency}${fmt(shipping)}`}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-wide uppercase">
          Total
        </span>
        <span className="text-base font-bold text-gray-900 dark:text-white tabular-nums">
          {currency}
          {fmt(total)}
        </span>
      </div>
    </div>
  );
};

export default CartTotal;
