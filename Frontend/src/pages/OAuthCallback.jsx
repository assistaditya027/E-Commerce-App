import { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';

const normalizeRedirect = (value) => {
  const text = String(value || '').trim();
  if (!text.startsWith('/') || text.startsWith('//')) return '/';
  if (text.length > 200) return '/';
  return text;
};

const OAuthCallback = () => {
  const { setToken } = useContext(ShopContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const redirect = normalizeRedirect(params.get('redirect') || '/');

    if (token) {
      setToken(token);
      try {
        localStorage.setItem('token', token);
      } catch {
        // ignore storage errors
      }
      navigate(redirect, { replace: true });
    } else {
      toast.error('OAuth login failed. Please try again.');
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate, setToken]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
      Signing you in...
    </div>
  );
};

export default OAuthCallback;
