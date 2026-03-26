import { useContext, useEffect, useState, useCallback } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

const CATEGORIES = ['Men', 'Women', 'Kids'];
const SUB_CATEGORIES = ['Topwear', 'Bottomwear', 'Winterwear'];
const RATINGS = [4, 3, 2];

// ── Collapsible filter section ──
const FilterSection = ({ title, defaultOpen = true, children, activeCount = 0 }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 tracking-widest uppercase">
            {title}
          </span>
          {activeCount > 0 && (
            <span className="text-[10px] bg-black text-white dark:bg-white dark:text-gray-900 px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-96 pb-4' : 'max-h-0'}`}
      >
        <div className="px-4 sm:px-5">{children}</div>
      </div>
    </div>
  );
};

// ── Custom checkbox ──
const CheckItem = ({ label, checked, onChange, count }) => (
  <label className="flex items-center justify-between cursor-pointer group py-0.5">
    <div className="flex items-center gap-2.5">
      <div
        onClick={onChange}
        className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-all duration-150
          ${checked ? 'bg-black border-black dark:bg-white dark:border-white' : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-500 dark:group-hover:border-gray-400'}`}
      >
        {checked && (
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span
        className={`text-sm transition-colors ${checked ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}
      >
        {label}
      </span>
    </div>
    {count !== undefined && (
      <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
    )}
  </label>
);

// ── Star rating row ──
const StarRow = ({ rating, checked, onChange, assets }) => (
  <label className="flex items-center justify-between cursor-pointer group py-0.5">
    <div className="flex items-center gap-2.5">
      <div
        onClick={onChange}
        className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-all duration-150
          ${checked ? 'bg-black border-black dark:bg-white dark:border-white' : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-500 dark:group-hover:border-gray-400'}`}
      >
        {checked && (
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <img
            key={i}
            src={i < rating ? assets.star_icon : assets.star_dull_icon}
            alt=""
            className="w-3"
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">& up</span>
    </div>
  </label>
);

// ── View toggle ──
const ViewToggle = ({ view, setView }) => (
  <div className="flex border border-gray-200 dark:border-gray-800 overflow-hidden">
    {[
      {
        key: 'grid4',
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </>
        ),
      },
      {
        key: 'grid3',
        icon: (
          <>
            <rect x="3" y="3" width="5" height="5" />
            <rect x="9.5" y="3" width="5" height="5" />
            <rect x="16" y="3" width="5" height="5" />
            <rect x="3" y="9.5" width="5" height="5" />
            <rect x="9.5" y="9.5" width="5" height="5" />
            <rect x="16" y="9.5" width="5" height="5" />
          </>
        ),
      },
      {
        key: 'list',
        icon: (
          <>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </>
        ),
      },
    ].map(({ key, icon }) => (
      <button
        key={key}
        onClick={() => setView(key)}
        className={`p-2 transition-colors ${view === key ? 'bg-black text-white dark:bg-white dark:text-gray-900' : 'hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400'}`}
      >
        <svg
          className="w-4 h-4"
          fill={key === 'list' ? 'none' : 'currentColor'}
          stroke="currentColor"
          strokeWidth={key === 'list' ? 2 : 0}
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
      </button>
    ))}
  </div>
);

// ══════════════════════════════════════════
//  MAIN COLLECTION PAGE
// ══════════════════════════════════════════
const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);

  const [showFilter, setShowFilter] = useState(true);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState('relevant');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minRating, setMinRating] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [view, setView] = useState('grid4');
  const [page, setPage] = useState(1);
  const [isFiltering, setIsFiltering] = useState(false);
  const ITEMS_PER_PAGE = 12;

  // Category product counts
  const getCatCount = (cat) => products.filter((p) => p.category === cat).length;
  const getSubCatCount = (sub) => products.filter((p) => p.subCategory === sub).length;

  useEffect(() => {
    if (products.length > 0) {
      const max = Math.max(...products.map((p) => p.price));
      setMaxPrice(max);
      setPriceRange([0, max]);
    }
  }, [products]);

  const toggle = (setter, val) =>
    setter((prev) => (prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]));

  const clearFilters = () => {
    setCategory([]);
    setSubCategory([]);
    setPriceRange([0, maxPrice]);
    setSortType('relevant');
    setMinRating([]);
    setInStockOnly(false);
    setPage(1);
  };

  const activeFilterCount =
    category.length +
    subCategory.length +
    minRating.length +
    (inStockOnly ? 1 : 0) +
    (priceRange[1] < maxPrice || priceRange[0] > 0 ? 1 : 0);

  const applyFilter = useCallback(() => {
    setIsFiltering(true);
    setTimeout(() => {
      let copy = products.slice();
      if (showSearch && search)
        copy = copy.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
      if (category.length > 0) copy = copy.filter((i) => category.includes(i.category));
      if (subCategory.length > 0) copy = copy.filter((i) => subCategory.includes(i.subCategory));
      copy = copy.filter((i) => i.price >= priceRange[0] && i.price <= priceRange[1]);
      if (minRating.length > 0)
        copy = copy.filter((i) => minRating.some((r) => (i.rating || 0) >= r));
      if (inStockOnly) copy = copy.filter((i) => i.inStock !== false);
      setFilterProducts(copy);
      setPage(1);
      setIsFiltering(false);
    }, 150);
  }, [products, showSearch, search, category, subCategory, priceRange, minRating, inStockOnly]);

  const sortProduct = useCallback(() => {
    const copy = filterProducts.slice();
    switch (sortType) {
      case 'low-high':
        setFilterProducts([...copy.sort((a, b) => a.price - b.price)]);
        break;
      case 'high-low':
        setFilterProducts([...copy.sort((a, b) => b.price - a.price)]);
        break;
      case 'newest':
        setFilterProducts([...copy.sort((a, b) => (b.date || 0) - (a.date || 0))]);
        break;
      case 'popular':
        setFilterProducts([...copy.sort((a, b) => (b.rating || 0) - (a.rating || 0))]);
        break;
      default:
        break;
    }
  }, [filterProducts, sortType]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);
  useEffect(() => {
    sortProduct();
  }, [sortProduct]);
  useEffect(() => {
    if (sortType === 'relevant') applyFilter();
  }, [sortType, applyFilter]);

  // Pagination
  const totalPages = Math.ceil(filterProducts.length / ITEMS_PER_PAGE);
  const pagedProducts = filterProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Grid class based on view
  const gridClass = {
    grid4: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6',
    grid3: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 gap-y-6',
    list: 'flex flex-col gap-3',
  }[view];

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 pt-6 sm:pt-10 border-t border-gray-100 dark:border-gray-800">
      {/* ════ Filter Sidebar ════ */}
      <div
        className={`transition-all duration-300 ease-in-out flex-shrink-0 ${showFilter ? 'sm:w-60 md:w-64 w-full' : 'sm:w-10 md:w-12 w-full'}`}
      >
        {/* Filter header */}
        <div className="flex items-center justify-between my-2 gap-3">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 cursor-pointer"
            title={showFilter ? 'Hide filters' : 'Show filters'}
          >
            {/* Hamburger/filter icon */}
            <svg
              className="w-5 h-5 text-gray-700 dark:text-gray-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
            {showFilter && (
              <span className="text-lg sm:text-xl font-medium flex items-center gap-2">
                FILTERS
                {activeFilterCount > 0 && (
                  <span className="text-xs bg-black text-white dark:bg-white dark:text-gray-900 px-1.5 py-0.5 rounded-full font-normal">
                    {activeFilterCount}
                  </span>
                )}
              </span>
            )}
            {/* Toggle arrow */}
            <svg
              className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 hidden sm:block ${showFilter ? '' : 'rotate-180'}`}
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

          {showFilter && activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white underline underline-offset-2 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter panels */}
        <div className={`flex-col gap-3 mt-2 ${showFilter ? 'flex' : 'hidden'}`}>
          {/* In Stock toggle */}
          <div className="border border-gray-200 dark:border-gray-800 px-4 sm:px-5 py-3.5 flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200 tracking-widest uppercase">
              In Stock Only
            </span>
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`w-10 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0
                ${inStockOnly ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white dark:bg-gray-900 rounded-full shadow transition-transform duration-200
                ${inStockOnly ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          {/* Categories */}
          <FilterSection title="Categories" defaultOpen={true} activeCount={category.length}>
            <div className="flex flex-col gap-2 pt-1">
              {CATEGORIES.map((cat) => (
                <CheckItem
                  key={cat}
                  label={cat}
                  checked={category.includes(cat)}
                  onChange={() => toggle(setCategory, cat)}
                  count={getCatCount(cat)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Type */}
          <FilterSection title="Type" defaultOpen={true} activeCount={subCategory.length}>
            <div className="flex flex-col gap-2 pt-1">
              {SUB_CATEGORIES.map((sub) => (
                <CheckItem
                  key={sub}
                  label={sub}
                  checked={subCategory.includes(sub)}
                  onChange={() => toggle(setSubCategory, sub)}
                  count={getSubCatCount(sub)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Price range */}
          <FilterSection
            title="Price Range"
            defaultOpen={true}
            activeCount={priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0}
          >
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span>₹{priceRange[0]}</span>
                <span>₹{priceRange[1]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-black dark:accent-white"
              />
              <div className="flex gap-2 mt-3">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  placeholder="Min"
                  className="w-1/2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  placeholder="Max"
                  className="w-1/2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>
            </div>
          </FilterSection>

          {/* Rating */}
          <FilterSection title="Min Rating" defaultOpen={false} activeCount={minRating.length}>
            <div className="flex flex-col gap-2 pt-1">
              {RATINGS.map((r) => (
                <StarRow
                  key={r}
                  rating={r}
                  checked={minRating.includes(r)}
                  onChange={() => toggle(setMinRating, r)}
                  assets={assets}
                />
              ))}
            </div>
          </FilterSection>

          {/* Active chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[...category, ...subCategory].map((tag) => (
                <span
                  key={tag}
                  onClick={() =>
                    category.includes(tag) ? toggle(setCategory, tag) : toggle(setSubCategory, tag)
                  }
                  className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-2.5 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {tag}
                  <svg
                    className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </span>
              ))}
              {inStockOnly && (
                <span
                  onClick={() => setInStockOnly(false)}
                  className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-2.5 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  In Stock
                  <svg
                    className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════ Product Grid ════ */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Title text1={'ALL'} text2={'COLLECTIONS'} />
            <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 hidden sm:block">
              ({filterProducts.length} items)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <ViewToggle view={view} setView={setView} />
            <div className="relative w-full sm:w-auto">
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                className="w-full sm:w-auto border border-gray-200 dark:border-gray-700 text-xs sm:text-sm px-3 py-2 pr-8 appearance-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-black dark:focus:border-white transition-colors cursor-pointer"
              >
                <option value="relevant">Sort: Relevant</option>
                <option value="low-high">Price: Low → High</option>
                <option value="high-low">Price: High → Low</option>
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
              </select>
              <svg
                className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
          </div>
        </div>

        {/* Loading shimmer */}
        {isFiltering ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-800 aspect-3/4 w-full rounded" />
                <div className="mt-2 h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                <div className="mt-1.5 h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filterProducts.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center gap-3">
            <svg
              className="w-12 h-12 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-300 font-medium">No products found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Try adjusting or clearing your filters
            </p>
            <button
              onClick={clearFilters}
              className="mt-2 text-sm border border-gray-300 dark:border-gray-700 px-5 py-2 hover:border-black dark:hover:border-white transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Product grid / list */}
            <div className={gridClass}>
              {pagedProducts.map((item, index) =>
                view === 'list' ? (
                  /* List view card */
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row gap-4 border border-gray-100 dark:border-gray-800 p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <img
                      src={item.image[0]}
                      alt={item.name}
                      className="w-full sm:w-24 h-44 sm:h-32 object-cover flex-shrink-0"
                    />
                    <div className="flex flex-col justify-between py-1 min-w-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {item.category} · {item.subCategory}
                        </p>
                      </div>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        ₹{item.price}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ProductItem
                    key={index}
                    name={item.name}
                    id={item._id}
                    price={item.price}
                    image={item.image}
                  />
                ),
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 sm:w-9 sm:h-9 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:border-black dark:hover:border-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className={`w-8 h-8 sm:w-9 sm:h-9 border text-sm transition-colors
                          ${page === p ? 'bg-black text-white border-black dark:bg-white dark:text-gray-900 dark:border-gray-200' : 'border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white'}`}
                      >
                        {p}
                      </button>
                    );
                  if (Math.abs(p - page) === 2)
                    return (
                      <span key={p} className="text-gray-400 dark:text-gray-500 text-sm">
                        …
                      </span>
                    );
                  return null;
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 sm:w-9 sm:h-9 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:border-black dark:hover:border-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Collection;
