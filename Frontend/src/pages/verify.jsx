import { useContext, useEffect, useCallback } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Verify = () => {
  const { navigate, token, setCartItems, backendUrl } = useContext(ShopContext);
  const [searchParams] = useSearchParams();

  const success = searchParams.get('success');
  const orderId = searchParams.get('orderId') || searchParams.get('orderid');

  const verifyPayment = useCallback(() => {
    const poll = async (attempt = 0) => {
      try {
        if (!token) return null;
        if (!backendUrl) {
          toast.error('Backend URL is not configured.');
          return null;
        }
        if (!orderId) {
          toast.error('Missing orderId.');
          return null;
        }

        const apiBase = backendUrl.replace(/\/+$/, '');
        const response = await axios.post(
          `${apiBase}/api/order/verifyStripe`,
          { success, orderId },
          { headers: { token }, validateStatus: () => true },
        );

        if (response.status === 202) {
          if (attempt >= 5) {
            toast.info('Payment is processing. Check your orders in a moment.');
            navigate('/orders');
            return;
          }
          setTimeout(() => poll(attempt + 1), 2000);
          return;
        }

        if (response.data.success) {
          setCartItems({});
          navigate('/orders');
        } else if (response.status === 400 && response.data?.status === 'Cancelled') {
          toast.error('Payment was cancelled.');
          navigate('/cart');
        } else {
          toast.error(response.data?.message || 'Payment verification failed.');
          navigate('/cart');
        }
      } catch (error) {
        console.warn(error);
        toast.error(error?.response?.data?.message || error.message);
        navigate('/cart');
      }
      return null;
    };

    return poll();
  }, [backendUrl, navigate, orderId, setCartItems, success, token]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Verifying your payment...</p>
      </div>
    </div>
  );
};

export default Verify;
