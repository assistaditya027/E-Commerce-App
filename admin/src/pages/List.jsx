import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const CURRENCY = '₹';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getTotalStock = (stock) => {
  if (!stock) return null;
  if (typeof stock === 'object' && !Array.isArray(stock)) {
    const vals = Object.values(stock);
    if (vals.length === 0) return null;
    return vals.reduce((s, v) => s + Number(v), 0);
  }
  return typeof stock === 'number' ? stock : null;
};

const stockConfig = (n) => {
  if (n === null) return null;
  if (n === 0)
    return {
      dot: 'bg-red-500',
      badge: 'bg-red-50 text-red-600 border-red-200',
      label: 'Out of stock',
    };
  if (n <= 5)
    return {
      dot: 'bg-amber-400',
      badge: 'bg-amber-50 text-amber-600 border-amber-200',
      label: `Low · ${n}`,
    };
  return {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: `${n} units`,
  };
};

// ── Delete Confirm ────────────────────────────────────────────────────────────
const Confirm = ({ product, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
      </div>
      <h3 className="text-center font-semibold text-gray-900 text-base mb-1">Delete Product?</h3>
      <p className="text-center text-sm text-gray-500 mb-6 leading-relaxed">
        <span className="font-medium text-gray-800">"{product.name}"</span> will be permanently
        removed from your store.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 text-sm font-semibold bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors rounded-xl"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Toggle Switch ─────────────────────────────────────────────────────────────
const Toggle = ({ id, field, value, onToggle, toggling, label, activeColor = 'bg-gray-900' }) => {
  const key = `${id}-${field}`;
  return (
    <button
      type="button"
      onClick={() => onToggle(id, field)}
      disabled={toggling[key]}
      className={`group flex items-center gap-2 cursor-pointer select-none ${toggling[key] ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div
        className={`relative w-8 h-4 rounded-full transition-colors duration-200 flex-shrink-0
        ${value ? activeColor : 'bg-gray-200'}`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200
          ${value ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </div>
      {label && (
        <span
          className={`text-[11px] font-medium transition-colors ${value ? 'text-gray-800' : 'text-gray-400'}`}
        >
          {label}
        </span>
      )}
    </button>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 animate-pulse">
    <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-gray-100 rounded-full w-2/5" />
      <div className="h-2 bg-gray-100 rounded-full w-1/4" />
    </div>
    <div className="hidden sm:flex gap-6">
      <div className="h-3 bg-gray-100 rounded-full w-16" />
      <div className="h-3 bg-gray-100 rounded-full w-14" />
      <div className="h-5 bg-gray-100 rounded-full w-20" />
    </div>
    <div className="h-7 bg-gray-100 rounded-lg w-20" />
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative bg-white border rounded-2xl px-3 sm:px-5 py-3 sm:py-4 text-left transition-all duration-150 shadow-sm hover:shadow-md active:scale-[0.98]
      ${active ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-100 hover:border-gray-300'}`}
  >
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">
          {label}
        </p>
        <p className={`text-xl sm:text-2xl font-bold mt-1 tabular-nums ${color}`}>{value}</p>
      </div>
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
        ${active ? 'bg-gray-900' : 'bg-gray-50 group-hover:bg-gray-100'}`}
      >
        <svg
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${active ? 'text-white' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
        </svg>
      </div>
    </div>
  </button>
);

// ══════════════════════════════════════════════════════════════════════════════
const List = ({ token, setToken }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [confirmItem, setConfirmItem] = useState(null);
  const [toggling, setToggling] = useState({});
  const [viewMode, setViewMode] = useState('list'); // "list" | "grid"
  const PER_PAGE = 12;

  const handleAuthError = useCallback(
    (e) => {
      const s = e?.response?.status;
      if (s === 401 || s === 403) {
        toast.error(e?.response?.data?.message || 'Session expired.');
        setToken('');
        return true;
      }
      return false;
    },
    [setToken],
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/product/list`, { headers: { token } });
      if (data.success) setProducts(data.products);
      else toast.error(data.message);
    } catch (e) {
      if (!handleAuthError(e)) toast.error(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, token]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      );
    }
    if (category !== 'All') list = list.filter((p) => p.category === category);
    if (statusFilter === 'Live') list = list.filter((p) => p.published !== false);
    if (statusFilter === 'Draft') list = list.filter((p) => p.published === false);
    if (statusFilter === 'Featured') list = list.filter((p) => p.featured);
    if (statusFilter === 'Bestseller') list = list.filter((p) => p.bestSeller);
    list.sort((a, b) => {
      let va = a[sortBy] ?? 0,
        vb = b[sortBy] ?? 0;
      if (typeof va === 'string') {
        va = va.toLowerCase();
        vb = vb.toLowerCase();
      }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
    });
    setFiltered(list);
    setPage(1);
  }, [products, search, category, statusFilter, sortBy, sortDir]);

  const handleDelete = async () => {
    if (!confirmItem) return;
    try {
      const { data } = await axios.delete(`${backendUrl}/api/product/remove/${confirmItem._id}`, {
        headers: { token },
      });
      if (data.success) {
        toast.success('Product deleted');
        setProducts((p) => p.filter((x) => x._id !== confirmItem._id));
      } else toast.error(data.message);
    } catch (e) {
      if (!handleAuthError(e)) toast.error(e?.response?.data?.message || e.message);
    } finally {
      setConfirmItem(null);
    }
  };

  const handleToggle = async (id, field) => {
    const key = `${id}-${field}`;
    setToggling((t) => ({ ...t, [key]: true }));
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/product/toggle`,
        { id, field },
        { headers: { token } },
      );
      if (data.success)
        setProducts((p) => p.map((x) => (x._id === id ? { ...x, [field]: data.value } : x)));
      else toast.error(data.message);
    } catch (e) {
      if (!handleAuthError(e)) toast.error(e?.response?.data?.message || e.message);
    } finally {
      setToggling((t) => ({ ...t, [key]: false }));
    }
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const stats = {
    total: products.length,
    live: products.filter((p) => p.published !== false).length,
    drafts: products.filter((p) => p.published === false).length,
    outOfStock: products.filter((p) => getTotalStock(p.stock) === 0).length,
  };

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const SortBtn = ({ col, children }) => (
    <button
      type="button"
      onClick={() => toggleSort(col)}
      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors group"
    >
      {children}
      <svg
        className={`w-3 h-3 transition-all ${sortBy === col ? 'opacity-100 text-gray-700' : 'opacity-0 group-hover:opacity-40'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={sortBy === col && sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
        />
      </svg>
    </button>
  );

  return (
    <div className="flex flex-col gap-5 pb-16 max-w-[1200px]">
      {/* ══ Page Header ══ */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">
            {loading ? 'Loading…' : `${products.length} total products`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchList}
            className="w-9 h-9 flex items-center justify-center border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500 transition-all rounded-xl"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            onClick={() => navigate('/add')}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 hover:bg-black active:scale-[0.98] transition-all rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* ══ Stats ══ */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          color="text-gray-900"
          icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          active={statusFilter === 'All'}
          onClick={() => setStatusFilter('All')}
        />
        <StatCard
          label="Live"
          value={stats.live}
          color="text-emerald-600"
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          active={statusFilter === 'Live'}
          onClick={() => setStatusFilter('Live')}
        />
        <StatCard
          label="Drafts"
          value={stats.drafts}
          color="text-amber-500"
          icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          active={statusFilter === 'Draft'}
          onClick={() => setStatusFilter('Draft')}
        />
        <StatCard
          label="No Stock"
          value={stats.outOfStock}
          color="text-red-500"
          icon="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          active={false}
          onClick={() => {}}
        />
      </div>

      {/* ══ Filters Bar ══ */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
            placeholder="Search products, SKU…"
            className="w-full border border-gray-200 bg-white pl-10 pr-9 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all text-base leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'Men', 'Women', 'Kids'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all duration-150
                ${
                  category === c
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Sort + View toggle */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="relative">
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [col, dir] = e.target.value.split('-');
                setSortBy(col);
                setSortDir(dir);
              }}
              className="border border-gray-200 bg-white text-xs sm:text-sm text-gray-600 pl-3 pr-7 py-2.5 appearance-none focus:outline-none focus:border-gray-400 transition-colors rounded-xl cursor-pointer"
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="name-asc">Name A → Z</option>
              <option value="name-desc">Name Z → A</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
            <svg
              className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
            {[
              { mode: 'list', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
              {
                mode: 'grid',
                icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
              },
            ].map(({ mode, icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`w-9 h-9 flex items-center justify-center transition-all
                  ${viewMode === mode ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <div className="flex items-center justify-between -mt-2">
          <p className="text-xs text-gray-400">
            {filtered.length === products.length
              ? `${filtered.length} products`
              : `${filtered.length} of ${products.length} products`}
          </p>
          {(search || category !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('All');
                setStatusFilter('All');
              }}
              className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ══ Product List / Grid ══ */}
      {viewMode === 'list' ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden sm:grid grid-cols-[56px_1fr_90px_90px_130px_100px_80px] gap-4 px-5 py-3 bg-gray-50/80 border-b border-gray-100">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Img
            </span>
            <SortBtn col="name">Product</SortBtn>
            <SortBtn col="category">Category</SortBtn>
            <SortBtn col="price">Price</SortBtn>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Stock
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Flags
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Actions
            </span>
          </div>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : paged.length === 0 ? (
            <EmptyState
              onClear={() => {
                setSearch('');
                setCategory('All');
                setStatusFilter('All');
              }}
            />
          ) : (
            paged.map((product) => (
              <ProductRow
                key={product._id}
                product={product}
                onEdit={() => navigate(`/edit/${product._id}`, { state: { product } })}
                onDelete={() => setConfirmItem(product)}
                onToggle={handleToggle}
                toggling={toggling}
              />
            ))
          )}
        </div>
      ) : /* Grid View */
      loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
            >
              <div className="aspect-[3/4] bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                <div className="h-2 bg-gray-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : paged.length === 0 ? (
        <EmptyState
          onClear={() => {
            setSearch('');
            setCategory('All');
            setStatusFilter('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {paged.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onEdit={() => navigate(`/edit/${product._id}`, { state: { product } })}
              onDelete={() => setConfirmItem(product)}
              onToggle={handleToggle}
              toggling={toggling}
            />
          ))}
        </div>
      )}

      {/* ══ Pagination ══ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-1">
          <p className="text-xs text-gray-400 tabular-nums">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of{' '}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-30 rounded-xl"
            >
              <svg
                className="w-3.5 h-3.5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
                    className={`w-8 h-8 border text-xs font-medium transition-all rounded-xl
                      ${
                        page === p
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                  >
                    {p}
                  </button>
                );
              if (Math.abs(p - page) === 2)
                return (
                  <span key={p} className="text-gray-300 text-xs w-4 text-center select-none">
                    …
                  </span>
                );
              return null;
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-30 rounded-xl"
            >
              <svg
                className="w-3.5 h-3.5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

      {confirmItem && (
        <Confirm
          product={confirmItem}
          onConfirm={handleDelete}
          onCancel={() => setConfirmItem(null)}
        />
      )}
    </div>
  );
};

// ── Product Row (List View) ────────────────────────────────────────────────────
const ProductRow = ({ product, onEdit, onDelete, onToggle, toggling }) => {
  const isLive = product.published !== false;
  const stockNum = getTotalStock(product.stock);
  const sc = stockConfig(stockNum);
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round((1 - product.price / product.comparePrice) * 100)
      : null;

  return (
    <div
      className={`group transition-colors border-b border-gray-50 last:border-0
      ${!isLive ? 'bg-gray-50/40' : 'hover:bg-gray-50/60'}`}
    >
      {/* ── Desktop ── */}
      <div className="hidden sm:grid grid-cols-[56px_1fr_90px_90px_130px_100px_80px] items-center gap-4 px-5 py-3.5">
        {/* Image */}
        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
          <img
            src={product.image?.[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {!isLive && (
            <div className="absolute inset-0 bg-gray-700/50 flex items-center justify-center">
              <span className="text-[7px] font-bold text-white">DRAFT</span>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
            {product.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400">{product.subCategory}</span>
            {product.sku && (
              <span className="text-[10px] text-gray-300 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                {product.sku}
              </span>
            )}
            {product.bestSeller && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                ⭐ BEST
              </span>
            )}
            {product.featured && (
              <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">
                ✦ FEAT
              </span>
            )}
          </div>
        </div>

        {/* Category */}
        <p className="text-sm text-gray-500">{product.category}</p>

        {/* Price */}
        <div>
          <p className="text-sm font-bold text-gray-900">
            {CURRENCY}
            {product.price}
          </p>
          {product.comparePrice > product.price && (
            <p className="text-[10px] text-gray-400 line-through">
              {CURRENCY}
              {product.comparePrice}
            </p>
          )}
          {discount && (
            <span className="text-[9px] font-bold text-emerald-600">{discount}% off</span>
          )}
        </div>

        {/* Stock */}
        <div className="flex flex-wrap gap-1">
          {product.stock && typeof product.stock === 'object' && !Array.isArray(product.stock)
            ? Object.entries(product.stock)
                .slice(0, 4)
                .map(([size, qty]) => {
                  const q = Number(qty);
                  return (
                    <span
                      key={size}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border
                      ${
                        q === 0
                          ? 'bg-red-50 text-red-500 border-red-200'
                          : q <= 5
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      {size}: {q}
                    </span>
                  );
                })
            : sc && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.badge}`}
                >
                  {sc.label}
                </span>
              )}
        </div>

        {/* Flags */}
        <div className="flex flex-col gap-1.5">
          <Toggle
            id={product._id}
            field="published"
            value={isLive}
            onToggle={onToggle}
            toggling={toggling}
            label="Live"
            activeColor="bg-emerald-500"
          />
          <Toggle
            id={product._id}
            field="bestSeller"
            value={!!product.bestSeller}
            onToggle={onToggle}
            toggling={toggling}
            label="Best"
            activeColor="bg-amber-500"
          />
          <Toggle
            id={product._id}
            field="featured"
            value={!!product.featured}
            onToggle={onToggle}
            toggling={toggling}
            label="Featured"
            activeColor="bg-purple-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Edit product"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Delete product"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="sm:hidden">
        <div className="flex gap-3 px-4 pt-4 pb-3">
          <div className="relative w-[64px] h-[64px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
            <img
              src={product.image?.[0]}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {!isLive && (
              <div className="absolute inset-0 bg-gray-700/40 flex items-end justify-center pb-1.5">
                <span className="text-[7px] font-bold text-white bg-gray-800/70 px-1.5 rounded">
                  DRAFT
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1">
              <p className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 flex-1">
                {product.name}
              </p>
              <div className="flex gap-0.5 flex-shrink-0">
                <button
                  onClick={onEdit}
                  className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={onDelete}
                  className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {product.category} · {product.subCategory}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-sm font-bold text-gray-900">
                {CURRENCY}
                {product.price}
              </span>
              {product.comparePrice > product.price && (
                <span className="text-[11px] text-gray-400 line-through">
                  {CURRENCY}
                  {product.comparePrice}
                </span>
              )}
              {discount && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                  -{discount}%
                </span>
              )}
              {sc && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${sc.badge}`}
                >
                  {sc.label}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Toggle strip */}
        <div className="flex border-t border-gray-50 divide-x divide-gray-50">
          {[
            { field: 'published', value: isLive, label: 'Live', activeColor: 'bg-emerald-500' },
            {
              field: 'bestSeller',
              value: !!product.bestSeller,
              label: 'Bestseller',
              activeColor: 'bg-amber-500',
            },
            {
              field: 'featured',
              value: !!product.featured,
              label: 'Featured',
              activeColor: 'bg-purple-500',
            },
          ].map(({ field, value, label, activeColor }) => (
            <label
              key={field}
              className="flex flex-1 items-center justify-center gap-2 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Toggle
                id={product._id}
                field={field}
                value={value}
                onToggle={onToggle}
                toggling={toggling}
                activeColor={activeColor}
              />
              <span
                className={`text-[11px] font-medium ${value ? 'text-gray-700' : 'text-gray-400'}`}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Product Card (Grid View) ──────────────────────────────────────────────────
const ProductCard = ({ product, onEdit, onDelete, onToggle, toggling }) => {
  const isLive = product.published !== false;
  const stockNum = getTotalStock(product.stock);
  const sc = stockConfig(stockNum);
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round((1 - product.price / product.comparePrice) * 100)
      : null;

  return (
    <div
      className={`group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200
      ${!isLive ? 'opacity-70' : ''}`}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        <img
          src={product.image?.[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-start justify-end p-2 gap-1 opacity-0 group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl shadow hover:bg-white transition-all"
          >
            <svg
              className="w-3.5 h-3.5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl shadow hover:bg-red-50 transition-all"
          >
            <svg
              className="w-3.5 h-3.5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {!isLive && (
            <span className="text-[9px] font-bold bg-gray-900/80 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
              DRAFT
            </span>
          )}
          {discount && (
            <span className="text-[9px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {product.bestSeller && (
            <span className="text-[9px] font-bold bg-amber-400 text-white px-2 py-0.5 rounded-full">
              ⭐ BEST
            </span>
          )}
        </div>
        {/* Stock dot */}
        {sc && (
          <div className="absolute bottom-2 right-2">
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm ${sc.badge}`}
            >
              {sc.label}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[12px] font-semibold text-gray-800 leading-snug line-clamp-2 mb-1">
          {product.name}
        </p>
        <p className="text-[10px] text-gray-400 mb-2">
          {product.category} · {product.subCategory}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-gray-900">
              {CURRENCY}
              {product.price}
            </span>
            {product.comparePrice > product.price && (
              <span className="text-[10px] text-gray-400 line-through ml-1">
                {CURRENCY}
                {product.comparePrice}
              </span>
            )}
          </div>
          <Toggle
            id={product._id}
            field="published"
            value={isLive}
            onToggle={onToggle}
            toggling={toggling}
            activeColor="bg-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ onClear }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
      <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-700">No products found</p>
      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
    </div>
    <button
      onClick={onClear}
      className="text-xs font-medium border border-gray-200 px-5 py-2 hover:border-gray-400 hover:bg-gray-50 transition-all text-gray-600 rounded-xl"
    >
      Clear all filters
    </button>
  </div>
);

export default List;
