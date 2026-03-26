import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const STATUS_CONFIG = {
  'Order Placed': { color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  'Payment Pending': { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Packing: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  Shipped: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  'Out for Delivery': {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  Delivered: { color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  Cancelled: { color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};
const STATUSES = Object.keys(STATUS_CONFIG);

const PAYMENT_CONFIG = {
  COD: { label: 'COD', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  Stripe: { label: 'Stripe', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  Razorpay: { label: 'Razorpay', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateTime = (ts) =>
  new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const fmtDateShort = (ts) =>
  new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const toSortableNumber = (v) => {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'string') {
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return typeof v === 'number' ? v : 0;
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Order Placed'];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 border rounded-full ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {status}
    </span>
  );
};

const ChevronIcon = ({ cls = '' }) => (
  <svg className={`w-3.5 h-3.5 ${cls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse">
    <div className="flex justify-between mb-3">
      <div className="flex gap-2 items-center">
        <div className="w-7 h-7 bg-gray-200 rounded-full" />
        <div className="space-y-1.5">
          <div className="h-2.5 bg-gray-200 rounded w-28" />
          <div className="h-2 bg-gray-100 rounded w-20" />
        </div>
      </div>
      <div className="h-5 bg-gray-200 rounded-full w-20" />
    </div>
    <div className="flex justify-between items-center">
      <div className="h-5 bg-gray-200 rounded w-16" />
      <div className="h-7 bg-gray-200 rounded-lg w-28" />
    </div>
  </div>
);

// ── Expanded detail ───────────────────────────────────────────────────────────
const OrderDetail = ({ order }) => (
  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
    {/* Items */}
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        Items
      </p>
      <div className="flex flex-col gap-1.5">
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-5 h-5 bg-gray-100 border border-gray-200 rounded text-[10px] flex items-center justify-center font-medium text-gray-500 flex-shrink-0">
              {item.quantity}
            </span>
            <span className="flex-1 truncate">{item.name}</span>
            {item.size && <span className="text-gray-400 flex-shrink-0">/ {item.size}</span>}
            <span className="text-gray-700 font-medium flex-shrink-0">
              {fmt(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Address */}
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        Delivery
      </p>
      <address className="not-italic text-xs text-gray-600 leading-relaxed">
        <p className="font-medium text-gray-800">
          {order.address?.firstName} {order.address?.lastName}
        </p>
        <p>{order.address?.street}</p>
        <p>
          {order.address?.city}, {order.address?.state} {order.address?.zipcode}
        </p>
        <p>{order.address?.country}</p>
        {order.address?.phone && <p className="mt-1 text-gray-500">📞 {order.address.phone}</p>}
      </address>
    </div>

    {/* Payment summary */}
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        Payment
      </p>
      <div className="flex flex-col gap-1.5 text-xs text-gray-600">
        {[
          ['Method', order.paymentMethod || '—'],
          [
            'Paid',
            order.payment ? '✓ Yes' : 'Pending',
            order.payment ? 'text-green-600' : 'text-amber-600',
          ],
          ['Total', fmt(order.amount), 'font-bold text-gray-900'],
          ['Placed', fmtDate(order.date)],
        ].map(([k, v, cls = '']) => (
          <div key={k} className="flex justify-between">
            <span className="text-gray-400">{k}</span>
            <span className={`font-medium ${cls}`}>{v}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Status history */}
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        History
      </p>
      <div className="flex flex-col gap-1.5 text-xs text-gray-600 max-h-40 overflow-auto">
        {(order.statusHistory || []).length === 0 ? (
          <p className="text-gray-400">No history yet</p>
        ) : (
          [...order.statusHistory]
            .sort((a, b) => (b.at || 0) - (a.at || 0))
            .map((h, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-gray-700 font-medium">{h.status}</span>
                <span className="text-[10px] text-gray-400">
                  {fmtDateTime(h.at)} {h.by ? `• ${h.by}` : ''}
                </span>
              </div>
            ))
        )}
      </div>
    </div>
  </div>
);

// ── Status select ─────────────────────────────────────────────────────────────
const StatusSelect = ({ order, onUpdate, updating, fullWidth = false }) => (
  <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
    <select
      value={order.status}
      onChange={(e) => onUpdate(order._id, e.target.value)}
      disabled={updating[order._id]}
      className={`border border-gray-200 bg-gray-50 text-xs px-2.5 py-1.5 pr-7 appearance-none
        focus:outline-none focus:border-gray-400 transition-colors rounded-lg
        ${fullWidth ? 'w-full' : ''}
        ${updating[order._id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
    {updating[order._id] ? (
      <svg
        className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    ) : (
      <svg
        className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
const Orders = ({ token, setToken }) => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [payFilter, setPayFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState({});
  const [monitorId, setMonitorId] = useState(null);
  const [monitorOrder, setMonitorOrder] = useState(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorError, setMonitorError] = useState('');
  const PER_PAGE = 8;

  const handleAuthError = useCallback(
    (err) => {
      const s = err?.response?.status;
      if (s === 401 || s === 403) {
        toast.error(err?.response?.data?.message || 'Session expired.');
        setToken('');
        return true;
      }
      return false;
    },
    [setToken],
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/order/list`, {}, { headers: { token } });
      if (data.success) {
        setOrders(data.orders.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      if (!handleAuthError(e)) toast.error(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(fetchOrders, 15000);
    return () => clearInterval(id);
  }, [fetchOrders, token]);

  const fetchMonitorOrder = useCallback(
    async (id, quiet = false) => {
      if (!id) return;
      setMonitorLoading(true);
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/order/single/${encodeURIComponent(id)}`,
          { headers: { token } },
        );
        if (data.success) {
          setMonitorOrder(data.order);
          setMonitorError('');
        } else {
          setMonitorError(data.message || 'Failed to load order');
          if (!quiet) toast.error(data.message || 'Failed to load order');
        }
      } catch (e) {
        if (!handleAuthError(e)) {
          const msg = e?.response?.data?.message || e.message;
          setMonitorError(msg);
          if (!quiet) toast.error(msg);
        }
      } finally {
        setMonitorLoading(false);
      }
    },
    [handleAuthError, token],
  );

  useEffect(() => {
    if (!monitorId) {
      setMonitorOrder(null);
      return;
    }
    fetchMonitorOrder(monitorId, true);
    const id = setInterval(() => fetchMonitorOrder(monitorId, true), 10000);
    return () => clearInterval(id);
  }, [monitorId, fetchMonitorOrder]);

  useEffect(() => {
    let list = [...orders];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o._id?.toLowerCase().includes(q) ||
          `${o.address?.firstName} ${o.address?.lastName}`.toLowerCase().includes(q) ||
          String(o.address?.phone ?? '').includes(q),
      );
    }
    if (statusFilter !== 'All') list = list.filter((o) => o.status === statusFilter);
    if (payFilter !== 'All') list = list.filter((o) => o.paymentMethod === payFilter);
    list.sort((a, b) => {
      const va = sortBy === 'date' ? toSortableNumber(a[sortBy]) : (a[sortBy] ?? 0);
      const vb = sortBy === 'date' ? toSortableNumber(b[sortBy]) : (b[sortBy] ?? 0);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    setFiltered(list);
    setPage(1);
  }, [orders, search, statusFilter, payFilter, sortBy, sortDir]);

  const handleStatusChange = async (orderId, status) => {
    setUpdating((u) => ({ ...u, [orderId]: true }));
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status },
        { headers: { token } },
      );

      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => {
            if (o._id !== orderId) return o;
            if (o.status === status) return o;
            return {
              ...o,
              status,
              statusHistory: [...(o.statusHistory || []), { status, at: new Date(), by: 'admin' }],
            };
          }),
        );
        if (monitorId === orderId) fetchMonitorOrder(orderId, true);
        toast.success(`Updated to "${status}"`);
      } else toast.error(data.message);
    } catch (e) {
      if (!handleAuthError(e)) toast.error(e?.response?.data?.message || e.message);
    } finally {
      setUpdating((u) => ({ ...u, [orderId]: false }));
    }
  };

  const stats = {
    total: orders.length,
    revenue: orders.filter((o) => o.payment).reduce((s, o) => s + (o.amount || 0), 0),
    pending: orders.filter((o) => !o.payment).length,
    delivered: orders.filter((o) => o.status === 'Delivered').length,
  };

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">{stats.total} total</p>
        </div>
        <button
          onClick={fetchOrders}
          className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:border-gray-400 text-gray-500 transition-colors rounded-lg"
          title="Refresh"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* ── Stats — 4-col on all sizes ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Orders', value: stats.total, color: 'text-gray-900' },
          { label: 'Revenue', value: fmt(stats.revenue), color: 'text-emerald-600' },
          { label: 'Unpaid', value: stats.pending, color: 'text-amber-600' },
          { label: 'Delivered', value: stats.delivered, color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white border border-gray-100 rounded-xl px-2.5 sm:px-4 py-2.5 shadow-sm text-center sm:text-left"
          >
            <p className="text-[9px] sm:text-[11px] text-gray-400 uppercase tracking-wider font-semibold leading-tight">
              {label}
            </p>
            <p className={`text-base sm:text-2xl font-bold mt-0.5 tabular-nums ${color}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-2">
        {/* Search */}
        <div className="relative">
          <svg
            className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, name or phone…"
            className="w-full border border-gray-200 bg-gray-50 pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-colors rounded-lg"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex gap-2 items-center flex-wrap">
          {/* Status */}
          <div className="relative flex-1 min-w-[110px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 text-xs px-2.5 py-2 pr-6 appearance-none focus:outline-none focus:border-gray-400 transition-colors rounded-lg"
            >
              <option value="All">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronIcon cls="text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Payment */}
          <div className="relative flex-1 min-w-[90px]">
            <select
              value={payFilter}
              onChange={(e) => setPayFilter(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 text-xs px-2.5 py-2 pr-6 appearance-none focus:outline-none focus:border-gray-400 transition-colors rounded-lg"
            >
              <option value="All">All payments</option>
              <option value="COD">COD</option>
              <option value="Stripe">Stripe</option>
              <option value="Razorpay">Razorpay</option>
            </select>
            <ChevronIcon cls="text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort buttons */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs flex-shrink-0">
            {[
              { key: 'date', label: 'Date' },
              { key: 'amount', label: 'Amount' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                  else {
                    setSortBy(key);
                    setSortDir('desc');
                  }
                }}
                className={`px-3 py-2 flex items-center gap-1 transition-colors
                  ${sortBy === key ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
              >
                {label}
                {sortBy === key && (
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-400 tabular-nums ml-auto whitespace-nowrap">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Order list ── */}
      {/* â”€â”€ Monitor Panel â”€â”€ */}
      {monitorId && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-gray-800">Monitoring Order</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                #{monitorId.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchMonitorOrder(monitorId)}
                className="text-xs border border-gray-200 px-3 py-1.5 hover:border-gray-400 transition-colors text-gray-600 rounded-lg"
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  setMonitorId(null);
                  setMonitorOrder(null);
                }}
                className="text-xs border border-gray-200 px-3 py-1.5 hover:border-gray-400 transition-colors text-gray-600 rounded-lg"
              >
                Stop
              </button>
            </div>
          </div>

          {monitorLoading ? (
            <div className="mt-3 text-xs text-gray-400">Loading latest update...</div>
          ) : monitorError ? (
            <div className="mt-3 text-xs text-red-500">{monitorError}</div>
          ) : monitorOrder ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                  Current Status
                </p>
                <StatusBadge status={monitorOrder.status} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                  Last Update
                </p>
                <p className="text-gray-700">
                  {fmtDateTime(
                    (monitorOrder.statusHistory || []).slice(-1)[0]?.at || monitorOrder.date,
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                  Auto Refresh
                </p>
                <p className="text-gray-700">Every 10 seconds</p>
              </div>
              <div className="sm:col-span-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">History</p>
                <div className="flex flex-col gap-1.5 text-gray-600">
                  {(monitorOrder.statusHistory || []).length === 0 ? (
                    <p className="text-gray-400">No history yet</p>
                  ) : (
                    [...monitorOrder.statusHistory]
                      .sort((a, b) => (b.at || 0) - (a.at || 0))
                      .map((h, i) => (
                        <div key={i} className="flex justify-between gap-2">
                          <span className="font-medium">{h.status}</span>
                          <span className="text-gray-400">
                            {fmtDateTime(h.at)} {h.by ? `• ${h.by}` : ''}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white border border-gray-100 rounded-xl">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
              <img src={assets.parcel_icon} alt="" className="w-6 opacity-30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">No orders found</p>
              <p className="text-xs text-gray-400 mt-0.5">Try adjusting your filters</p>
            </div>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setPayFilter('All');
              }}
              className="text-xs border border-gray-200 px-4 py-1.5 hover:border-gray-400 transition-colors text-gray-600 rounded-lg"
            >
              Clear filters
            </button>
          </div>
        ) : (
          paged.map((order) => {
            const isExpanded = expanded === order._id;
            const itemCount = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;
            const paymentCfg = PAYMENT_CONFIG[order.paymentMethod] || PAYMENT_CONFIG.COD;
            const initials = order.address?.firstName?.[0]?.toUpperCase() || '?';
            const isMonitored = monitorId === order._id;

            return (
              <div
                key={order._id}
                className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden hover:border-gray-200 transition-colors"
              >
                {/* ── Card top: avatar + name + meta ── */}
                <div className="flex items-start gap-3 px-4 pt-3.5 pb-0">
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                    {initials}
                  </div>

                  {/* Name + order ID + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                          {order.address?.firstName} {order.address?.lastName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          #{order._id?.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      {/* Expand button */}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : order._id)}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 -mt-0.5"
                      >
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Badge row */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 border rounded-full ${paymentCfg.color}`}
                      >
                        {paymentCfg.label}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 border rounded-full
                      ${order.payment ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                      >
                        {order.payment ? 'Paid' : 'Unpaid'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] text-gray-400">{fmtDateShort(order.date)}</span>
                    </div>
                  </div>
                </div>

                {/* ── Card bottom: amount + status badge + status changer ── */}
                <div className="flex items-center justify-between gap-3 px-4 pt-2.5 pb-3.5">
                  {/* Amount */}
                  <p className="text-base font-bold text-gray-900 tabular-nums flex-shrink-0">
                    {fmt(order.amount)}
                  </p>

                  {/* Status badge + changer side by side */}
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <StatusBadge status={order.status} />
                    <StatusSelect order={order} onUpdate={handleStatusChange} updating={updating} />
                    <button
                      onClick={() => {
                        if (isMonitored) {
                          setMonitorId(null);
                          setMonitorOrder(null);
                        } else {
                          setMonitorId(order._id);
                          fetchMonitorOrder(order._id);
                        }
                      }}
                      className={`text-[10px] font-semibold px-2 py-1 border rounded-full transition-colors
                      ${isMonitored ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'}`}
                    >
                      {isMonitored ? 'Monitoring' : 'Monitor'}
                    </button>
                  </div>
                </div>

                {/* ── Expanded detail ── */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <OrderDetail order={order} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400 tabular-nums whitespace-nowrap">
            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of{' '}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 border border-gray-200 flex items-center justify-center hover:border-gray-400 disabled:opacity-30 transition-colors rounded-lg"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 border text-xs transition-colors rounded-lg
                      ${page === p ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:border-gray-400 text-gray-600'}`}
                  >
                    {p}
                  </button>
                );
              if (Math.abs(p - page) === 2)
                return (
                  <span key={p} className="text-gray-300 text-xs w-4 text-center">
                    …
                  </span>
                );
              return null;
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 border border-gray-200 flex items-center justify-center hover:border-gray-400 disabled:opacity-30 transition-colors rounded-lg"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
