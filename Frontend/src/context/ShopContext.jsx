import { createContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = '₹';
  const deliveryFeeEnv = Number(import.meta.env.VITE_DELIVERY_FEE);
  const delivery_fee = Number.isFinite(deliveryFeeEnv) ? deliveryFeeEnv : 10;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const apiBase = backendUrl ? backendUrl.replace(/\/+$/, '') : '';

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState('');

  // ── Wishlist: stored as array of product _id strings ──
  const [wishlist, setWishlist] = useState([]);

  const navigate = useNavigate();

  // ── Safe localStorage helpers ──
  const safeGet = (key) => {
    if (typeof window === 'undefined') return null;
    try { return window.localStorage.getItem(key); }
    catch { return null; }
  };

  const safeSet = (key, value) => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(key, value); }
    catch { /* ignore */ }
  };

  // ══════════════════════════════════════════
  //  WISHLIST FUNCTIONS
  // ══════════════════════════════════════════

  // Toggle a product in/out of wishlist
  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      safeSet('wishlist', JSON.stringify(updated));
      return updated;
    });
  };

  // Check if a product is wishlisted
  const isWishlisted = (productId) => wishlist.includes(productId);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const stored = safeGet('wishlist');
    if (stored) {
      try { setWishlist(JSON.parse(stored)); }
      catch { /* ignore */ }
    }
  }, []);

  // ══════════════════════════════════════════
  //  CART FUNCTIONS (unchanged)
  // ══════════════════════════════════════════

  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error('Please Select a size');
      return;
    }
    const cartData = structuredClone(cartItems);
    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }
    setCartItems(cartData);
    if (token) {
      try {
        if (!apiBase) { toast.error('Backend URL is not configured.'); return; }
        await axios.post(`${apiBase}/api/cart/add`, { itemId, size }, { headers: { token } });
      } catch (error) {
        console.warn(error);
        toast.error(error.message);
      }
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) totalCount += cartItems[items][item];
        } catch (error) { console.warn(error); }
      }
    }
    return totalCount;
  };

  const updateQuantity = async (itemId, size, quantity) => {
    const cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;
    setCartItems(cartData);
    if (token) {
      try {
        if (!apiBase) { toast.error('Backend URL is not configured.'); return; }
        await axios.post(`${apiBase}/api/cart/update`, { itemId, size, quantity }, { headers: { token } });
      } catch (error) {
        console.warn(error);
        toast.error(error.message);
      }
    }
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      const itemInfo = products.find((product) => product._id === items);
      if (!itemInfo) continue;
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0)
            totalAmount += cartItems[items][item] * itemInfo.price;
        } catch (error) {
          console.warn(error);
          toast.error(error.message);
        }
      }
    }
    return totalAmount;
  };

  const getProductsData = useCallback(async () => {
    try {
      if (!apiBase) { toast.error('Backend URL is not configured.'); return; }
      const response = await axios.get(`${apiBase}/api/product/list`);
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.warn(error);
      toast.error(error?.response?.data?.message || error.message);
    }
  }, [apiBase]);

  const loadUserCart = useCallback(async (authToken) => {
    if (!apiBase) return;
    try {
      const response = await axios.post(
        `${apiBase}/api/cart/get`, {},
        { headers: { token: authToken } },
      );
      if (response.data.success) {
        setCartItems(response.data.cartData || {});
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.warn(error);
      toast.error(error?.response?.data?.message || error.message);
    }
  }, [apiBase]);

  useEffect(() => { getProductsData(); }, [getProductsData]);

  useEffect(() => {
    if (!token) {
      const storedToken = safeGet('token');
      if (storedToken) setToken(storedToken);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadUserCart(token);
    } else {
      const storedCart = safeGet('cartItems');
      if (storedCart) {
        try { setCartItems(JSON.parse(storedCart)); }
        catch (error) { console.warn(error); }
      }
    }
  }, [token, loadUserCart]);

  useEffect(() => {
    if (!token) safeSet('cartItems', JSON.stringify(cartItems));
  }, [cartItems, token]);

  // ── Context value ──
  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    setToken,
    token,
    // Wishlist
    wishlist,
    toggleWishlist,
    isWishlisted,
  };

  return <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>;
};

export default ShopContextProvider;