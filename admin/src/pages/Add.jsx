import { useState } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';

const CATEGORIES = ['Men', 'Women', 'Kids'];
const SUB_CATEGORIES = ['Topwear', 'Bottomwear', 'Winterwear'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const LOW_STOCK = 5;

const field =
  'w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:bg-white transition-colors rounded-sm';
const label = 'block text-[11px] font-semibold tracking-widest uppercase text-gray-400 mb-1.5';
const err = 'text-[11px] text-red-400 mt-1.5 flex items-center gap-1';

const Slot = ({ id, preview, onChange, isMain }) => (
  <label
    htmlFor={id}
    className="relative cursor-pointer aspect-square border border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-white transition-all duration-150 overflow-hidden flex items-center justify-center group"
  >
    {preview ? (
      <>
        <img src={preview} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        {isMain && (
          <span className="absolute top-1.5 left-1.5 text-[9px] font-bold tracking-wider bg-black text-white px-1.5 py-0.5 uppercase">
            Main
          </span>
        )}
      </>
    ) : (
      <img
        src={assets.upload_area}
        alt="upload"
        className="w-10 sm:w-14 opacity-50 group-hover:opacity-70 transition-opacity"
      />
    )}
    <input type="file" id={id} hidden accept="image/*" onChange={onChange} />
  </label>
);

const Section = ({ title, children }) => (
  <div className="bg-white border border-gray-100 rounded-lg p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
    <p className="text-xs font-bold tracking-widest uppercase text-gray-400 pb-2 border-b border-gray-100">
      {title}
    </p>
    {children}
  </div>
);

const Err = ({ msg }) =>
  msg ? (
    <p className={err}>
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {msg}
    </p>
  ) : null;

const Add = ({ token, setToken }) => {
  const [images, setImages] = useState([null, null, null, null]);
  const [previews, setPreviews] = useState([null, null, null, null]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Men');
  const [subCategory, setSubCategory] = useState('Topwear');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [sizes, setSizes] = useState([]);
  // ── Per-size stock: { S: "10", M: "0", L: "8" } ──
  const [stockPerSize, setStockPerSize] = useState({});
  const [bestseller, setBestseller] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  const handleAuthError = (e) => {
    const status = e?.response?.status;
    if (status === 401 || status === 403) {
      toast.error(e?.response?.data?.message || 'Session expired. Please log in again.');
      setToken('');
      return true;
    }
    return false;
  };

  const handleImage = (i) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ni = [...images];
    ni[i] = file;
    const np = [...previews];
    np[i] = URL.createObjectURL(file);
    setImages(ni);
    setPreviews(np);
    setErrors((p) => ({ ...p, images: undefined }));
  };

  const toggleSize = (s) => {
    setSizes((prev) => {
      const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
      // Remove stock entry if size is deselected
      if (!next.includes(s)) {
        setStockPerSize((sp) => {
          const c = { ...sp };
          delete c[s];
          return c;
        });
      }
      return next;
    });
    setErrors((p) => ({ ...p, sizes: undefined }));
  };

  const setStockForSize = (s, val) => {
    setStockPerSize((prev) => ({ ...prev, [s]: val }));
  };

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase();
      if (!tags.includes(t)) setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  const validate = () => {
    const e = {};
    if (!images[0]) e.images = 'At least one image is required.';
    if (!name.trim()) e.name = 'Product name is required.';
    if (!description.trim()) e.desc = 'Description is required.';
    if (!price || isNaN(price) || +price <= 0) e.price = 'Enter a valid price.';
    if (sizes.length === 0) e.sizes = 'Select at least one size.';
    return e;
  };

  const reset = () => {
    setImages([null, null, null, null]);
    setPreviews([null, null, null, null]);
    setName('');
    setDescription('');
    setPrice('');
    setComparePrice('');
    setSku('');
    setStockPerSize({});
    setCategory('Men');
    setSubCategory('Topwear');
    setTags([]);
    setTagInput('');
    setSizes([]);
    setBestseller(false);
    setFeatured(false);
    setPublished(true);
    setMetaTitle('');
    setMetaDesc('');
    setErrors({});
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setActiveTab('basic');
      return;
    }
    setLoading(true);
    try {
      // Build stock map with only selected sizes, default 0 if blank
      const stockMap = {};
      sizes.forEach((s) => {
        stockMap[s] = Number(stockPerSize[s] ?? 0);
      });

      const fd = new FormData();
      fd.append('name', name);
      fd.append('description', description);
      fd.append('price', price);
      fd.append('comparePrice', comparePrice);
      fd.append('sku', sku);
      fd.append('stock', JSON.stringify(stockMap)); // ← JSON string
      fd.append('category', category);
      fd.append('subCategory', subCategory);
      fd.append('sizes', JSON.stringify(sizes));
      fd.append('tags', JSON.stringify(tags));
      fd.append('bestseller', bestseller);
      fd.append('featured', featured);
      fd.append('published', published);
      fd.append('metaTitle', metaTitle || name);
      fd.append('metaDesc', metaDesc || description.slice(0, 160));
      images.forEach((img, i) => {
        if (img) fd.append(`image${i + 1}`, img);
      });

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/product/add`, fd, {
        headers: { token },
      });
      if (res.data.success) {
        toast.success('Product added!');
        reset();
      } else {
        toast.error(res.data.message || 'Failed to add product.');
      }
    } catch (e) {
      if (!handleAuthError(e)) toast.error(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'seo', label: 'SEO' },
  ];

  const discount =
    comparePrice && price && +comparePrice > +price
      ? Math.round((1 - price / comparePrice) * 100)
      : null;

  return (
    <div className="max-w-3xl pb-16">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
            Add New Product
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
            Fill in the details to list a product in your store.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0 mt-0.5">
          <span className="text-xs font-medium text-gray-500">{published ? 'Live' : 'Draft'}</span>
          <button
            type="button"
            onClick={() => setPublished(!published)}
            className={`w-10 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0
              ${published ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
              ${published ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </label>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:gap-5">
        {/* ══ Images ══ */}
        <Section title="Product Images">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Slot
                key={i}
                id={`image${i + 1}`}
                isMain={i === 0}
                preview={previews[i]}
                onChange={handleImage(i)}
              />
            ))}
          </div>
          <Err msg={errors.images} />
          <p className="text-[11px] text-gray-400">
            First slot = main image. Supports JPG, PNG, WEBP.
          </p>
        </Section>

        {/* ══ Tabs ══ */}
        <div className="flex border-b border-gray-100 gap-0 sm:gap-1 overflow-x-auto scrollbar-none">
          {TABS.map(({ key, label: tabLabel }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 text-xs font-semibold tracking-wide transition-all border-b-2 -mb-px whitespace-nowrap
                ${
                  activeTab === key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              {tabLabel}
              {key === 'basic' && (errors.name || errors.desc || errors.sizes) && (
                <span className="ml-1.5 w-1.5 h-1.5 bg-red-400 rounded-full inline-block align-middle" />
              )}
              {key === 'pricing' && errors.price && (
                <span className="ml-1.5 w-1.5 h-1.5 bg-red-400 rounded-full inline-block align-middle" />
              )}
            </button>
          ))}
        </div>

        {/* ══ Tab: Basic Info ══ */}
        {activeTab === 'basic' && (
          <>
            <Section title="Product Details">
              <div>
                <label className={label}>Product Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="e.g. Women Round Neck Cotton Top"
                  className={field}
                />
                <Err msg={errors.name} />
              </div>

              <div>
                <label className={label}>Description *</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((p) => ({ ...p, desc: undefined }));
                  }}
                  placeholder="Describe the product — material, fit, occasion…"
                  className={`${field} resize-none`}
                />
                <div className="flex items-center justify-between">
                  <Err msg={errors.desc} />
                  <span className="text-[11px] text-gray-400 ml-auto mt-1">
                    {description.length} chars
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={label}>Category</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`${field} appearance-none pr-8`}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
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
                </div>
                <div>
                  <label className={label}>Sub-Category</label>
                  <div className="relative">
                    <select
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className={`${field} appearance-none pr-8`}
                    >
                      {SUB_CATEGORIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
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
                </div>
              </div>

              <div>
                <label className={label}>Tags</label>
                <div
                  className={`${field} flex flex-wrap gap-1.5 min-h-[42px] cursor-text`}
                  onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
                >
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1 bg-gray-100 border border-gray-200 text-xs px-2 py-0.5 rounded-sm"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="text-gray-400 hover:text-gray-700 text-base leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder={tags.length ? '' : 'Type and press Enter…'}
                    className="flex-1 min-w-[80px] outline-none bg-transparent text-sm placeholder-gray-400"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Press Enter or comma to add a tag.</p>
              </div>
            </Section>

            {/* ── Sizes + per-size stock ── */}
            <Section title="Sizes & Stock">
              <div className="flex flex-wrap gap-2 mb-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`w-11 sm:w-12 py-2 text-sm border transition-all duration-150 rounded-sm
                      ${
                        sizes.includes(s)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-500 bg-white'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Err msg={errors.sizes} />

              {/* Per-size stock inputs — only shown after sizes are selected */}
              {sizes.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-gray-400 mb-2">
                    Stock per Size
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sizes.map((s) => {
                      const val = stockPerSize[s] ?? '';
                      const num = Number(val);
                      const isLow = val !== '' && num > 0 && num <= LOW_STOCK;
                      const isOut = val !== '' && num === 0;
                      return (
                        <div
                          key={s}
                          className={`flex items-center gap-2 border rounded-sm px-3 py-2
                          ${
                            isOut
                              ? 'border-red-200 bg-red-50'
                              : isLow
                                ? 'border-amber-200 bg-amber-50'
                                : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <span
                            className={`text-xs font-bold w-8 flex-shrink-0
                            ${isOut ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-gray-600'}`}
                          >
                            {s}
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={val}
                            onChange={(e) => setStockForSize(s, e.target.value)}
                            placeholder="0"
                            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                          />
                          {isOut && (
                            <span className="text-[9px] font-bold text-red-400 uppercase flex-shrink-0">
                              Out
                            </span>
                          )}
                          {isLow && (
                            <span className="text-[9px] font-bold text-amber-500 uppercase flex-shrink-0">
                              Low
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Leave blank to default to 0 (out of stock).
                  </p>
                </div>
              )}
            </Section>

            <Section title="Visibility & Flags">
              {[
                {
                  id: 'bs',
                  val: bestseller,
                  set: setBestseller,
                  title: 'Bestseller',
                  desc: 'Show in bestsellers section on the homepage.',
                },
                {
                  id: 'ft',
                  val: featured,
                  set: setFeatured,
                  title: 'Featured Product',
                  desc: 'Highlighted in featured banners and campaigns.',
                },
              ].map(({ id, val, set, title: t, desc: d }) => (
                <label key={id} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => set(!val)}
                    className={`w-4 h-4 mt-0.5 border flex items-center justify-center flex-shrink-0 transition-all duration-150 rounded-sm
                      ${val ? 'bg-gray-900 border-gray-900' : 'border-gray-300 group-hover:border-gray-500'}`}
                  >
                    {val && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t}</p>
                    <p className="text-xs text-gray-400">{d}</p>
                  </div>
                </label>
              ))}
            </Section>
          </>
        )}

        {/* ══ Tab: Pricing ══ */}
        {activeTab === 'pricing' && (
          <Section title="Pricing & Inventory">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className={label}>Selling Price (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setErrors((p) => ({ ...p, price: undefined }));
                    }}
                    placeholder="0"
                    className={`${field} pl-7`}
                  />
                </div>
                <Err msg={errors.price} />
              </div>

              <div>
                <label className={label}>Compare-at Price (MRP)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    placeholder="0"
                    className={`${field} pl-7`}
                  />
                </div>
                {discount && (
                  <p className="text-[11px] text-green-600 font-semibold mt-1">
                    {discount}% off badge will show
                  </p>
                )}
              </div>

              <div>
                <label className={label}>SKU</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. WMN-TOP-001"
                  className={field}
                />
                <p className="text-[11px] text-gray-400 mt-1">Unique stock-keeping identifier.</p>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 border border-dashed border-gray-200 rounded-sm px-3 py-2 bg-gray-50">
              💡 Stock is managed per size — go to the <strong>Basic Info</strong> tab → Sizes &
              Stock section.
            </p>
          </Section>
        )}

        {/* ══ Tab: SEO ══ */}
        {activeTab === 'seo' && (
          <Section title="Search Engine Optimisation">
            <p className="text-xs text-gray-400 -mt-2">
              Controls how this product appears in Google search results.
            </p>
            <div>
              <label className={label}>Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={name || 'Product meta title'}
                className={field}
              />
              <p
                className={`text-[11px] mt-1 ${metaTitle.length > 60 ? 'text-red-400' : 'text-gray-400'}`}
              >
                {metaTitle.length} / 60 chars
              </p>
            </div>
            <div>
              <label className={label}>Meta Description</label>
              <textarea
                rows={3}
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                placeholder={
                  description.slice(0, 160) || 'Brief product description for search engines…'
                }
                className={`${field} resize-none`}
              />
              <p
                className={`text-[11px] mt-1 ${metaDesc.length > 160 ? 'text-red-400' : 'text-gray-400'}`}
              >
                {metaDesc.length} / 160 chars
              </p>
            </div>
            <div className="border border-gray-100 rounded-sm p-3 sm:p-4 bg-gray-50">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Google Preview
              </p>
              <p className="text-blue-600 text-sm font-medium truncate">
                {metaTitle || name || 'Product Title'}
              </p>
              <p className="text-green-700 text-xs mt-0.5 truncate">
                clovo.com › products › {name.toLowerCase().replace(/\s+/g, '-') || 'product-slug'}
              </p>
              <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                {metaDesc ||
                  description.slice(0, 160) ||
                  'Your product description will appear here in search results…'}
              </p>
            </div>
          </Section>
        )}

        {/* ══ Submit bar ══ */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 sm:px-7 py-2.5 text-sm font-medium hover:bg-black active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                Saving…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {published ? 'Publish Product' : 'Save Draft'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-4 sm:px-5 py-2.5 text-sm text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-700 transition-colors rounded-sm"
          >
            Reset
          </button>
          <span className="text-xs text-gray-400 sm:ml-auto w-full sm:w-auto">
            {published ? 'Product will go live immediately.' : 'Product will be saved as draft.'}
          </span>
        </div>
      </form>
    </div>
  );
};

export default Add;
