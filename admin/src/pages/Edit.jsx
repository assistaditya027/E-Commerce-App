import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';

const CATEGORIES = ['Men', 'Women', 'Kids'];
const SUB_CATEGORIES = ['Topwear', 'Bottomwear', 'Winterwear'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const LOW_STOCK = 5;

const field =
  'w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:bg-white transition-colors rounded-sm';
const lbl = 'block text-[11px] font-semibold tracking-widest uppercase text-gray-400 mb-1.5';
const errCls = 'text-[11px] text-red-400 mt-1.5 flex items-center gap-1';

const Section = ({ title, children }) => (
  <div className="bg-white border border-gray-100 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
    <p className="text-xs font-bold tracking-widest uppercase text-gray-400 pb-2 border-b border-gray-100">
      {title}
    </p>
    {children}
  </div>
);

const Err = ({ msg }) =>
  msg ? (
    <p className={errCls}>
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

const Slot = ({ id, existingUrl, preview, onChange, isMain }) => {
  const display = preview || existingUrl;
  return (
    <label
      htmlFor={id}
      className="relative cursor-pointer aspect-square border border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-white transition-all duration-150 overflow-hidden flex items-center justify-center group"
    >
      {display ? (
        <>
          <img src={display} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
          {preview && (
            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 uppercase rounded-sm">
              New
            </span>
          )}
        </>
      ) : (
        <img
          src={assets.upload_area}
          alt="upload"
          className="w-14 opacity-50 group-hover:opacity-70 transition-opacity"
        />
      )}
      <input type="file" id={id} hidden accept="image/*" onChange={onChange} />
    </label>
  );
};

const SelectField = ({ value, onChange, options }) => (
  <div className="relative">
    <select value={value} onChange={onChange} className={`${field} appearance-none pr-8`}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
    <svg
      className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>
);

// Convert Mongoose Map (object or Map instance) to plain { S: "10", M: "0" }
const mapToObj = (stockVal) => {
  if (!stockVal) return {};
  if (stockVal instanceof Map) {
    const obj = {};
    stockVal.forEach((v, k) => {
      obj[k] = String(v);
    });
    return obj;
  }
  if (typeof stockVal === 'object') {
    const obj = {};
    Object.entries(stockVal).forEach(([k, v]) => {
      obj[k] = String(v);
    });
    return obj;
  }
  return {};
};

const Edit = ({ token, setToken }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prefilled = useRef(false);

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  const [existingImages, setExistingImages] = useState(['', '', '', '']);
  const [newFiles, setNewFiles] = useState([null, null, null, null]);
  const [newPreviews, setNewPreviews] = useState([null, null, null, null]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [sku, setSku] = useState('');
  const [stockPerSize, setStockPerSize] = useState({}); // { S: "10", M: "0" }
  const [category, setCategory] = useState('Men');
  const [subCategory, setSubCategory] = useState('Topwear');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [sizes, setSizes] = useState([]);
  const [bestseller, setBestseller] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');

  const handleAuthError = useCallback(
    (e) => {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        toast.error(e?.response?.data?.message || 'Session expired.');
        setToken('');
        return true;
      }
      return false;
    },
    [setToken],
  );

  const fillForm = useCallback((p) => {
    setName(p.name || '');
    setDescription(p.description || '');
    setPrice(String(p.price ?? ''));
    setComparePrice(p.comparePrice ? String(p.comparePrice) : '');
    setSku(p.sku || '');
    setCategory(p.category || 'Men');
    setSubCategory(p.subCategory || 'Topwear');
    setTags(Array.isArray(p.tags) ? p.tags : []);
    const sz = Array.isArray(p.sizes) ? p.sizes : [];
    setSizes(sz);
    setBestseller(!!p.bestSeller);
    setFeatured(!!p.featured);
    setPublished(p.published !== false);
    setMetaTitle(p.metaTitle || '');
    setMetaDesc(p.metaDesc || '');

    // Prefill per-size stock from the Map field
    setStockPerSize(mapToObj(p.stock));

    const imgs = Array.isArray(p.image) ? p.image : [];
    setExistingImages([imgs[0] || '', imgs[1] || '', imgs[2] || '', imgs[3] || '']);
  }, []);

  useEffect(() => {
    if (prefilled.current) return;
    const p = location.state?.product;
    if (p) {
      fillForm(p);
      setFetching(false);
      prefilled.current = true;
    }
  }, [location.state, fillForm]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/${id}`, {
          headers: { token },
        });
        if (!data.success) {
          toast.error(data.message);
          navigate('/list');
          return;
        }
        fillForm(data.product);
      } catch (e) {
        if (!handleAuthError(e)) toast.error(e?.response?.data?.message || e.message);
      } finally {
        setFetching(false);
      }
    })();
  }, [id, token, navigate, fillForm, handleAuthError]);

  const handleImage = (i) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const nf = [...newFiles];
    nf[i] = file;
    const np = [...newPreviews];
    np[i] = URL.createObjectURL(file);
    setNewFiles(nf);
    setNewPreviews(np);
  };

  const toggleSize = (s) => {
    setSizes((prev) => {
      const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
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
    const hasAnyImage = newFiles.some(Boolean) || existingImages.some(Boolean);
    if (!hasAnyImage) e.images = 'At least one image is required.';
    if (!name.trim()) e.name = 'Product name is required.';
    if (!description.trim()) e.desc = 'Description is required.';
    if (!price || isNaN(price) || +price <= 0) e.price = 'Enter a valid price.';
    if (sizes.length === 0) e.sizes = 'Select at least one size.';
    return e;
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
      // Build stock map with only selected sizes
      const stockMap = {};
      sizes.forEach((s) => {
        stockMap[s] = Number(stockPerSize[s] ?? 0);
      });

      const fd = new FormData();
      fd.append('id', id);
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
      fd.append('bestSeller', bestseller);
      fd.append('featured', featured);
      fd.append('published', published);
      fd.append('metaTitle', metaTitle || name);
      fd.append('metaDesc', metaDesc || description.slice(0, 160));
      newFiles.forEach((file, i) => {
        if (file) fd.append(`image${i + 1}`, file);
      });

      const { data } = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/update/${id}`,
        fd,
        { headers: { token } },
      );

      if (data.success) {
        toast.success('Product updated!');
        navigate('/list');
      } else {
        toast.error(data.message || 'Update failed.');
      }
    } catch (e) {
      if (!handleAuthError(e)) toast.error(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const discount =
    comparePrice && price && +comparePrice > +price
      ? Math.round((1 - +price / +comparePrice) * 100)
      : null;

  const TABS = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'pricing', label: 'Pricing & Stock' },
    { key: 'seo', label: 'SEO' },
  ];

  if (fetching)
    return (
      <div className="max-w-3xl animate-pulse flex flex-col gap-5">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="bg-white border border-gray-100 rounded-lg p-5">
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded" />
            ))}
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-lg p-5 space-y-3">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );

  return (
    <div className="max-w-3xl pb-16">
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/list')}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:border-gray-400 transition-colors text-gray-500"
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
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Edit Product</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              #{id?.slice(-10).toUpperCase()}
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
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

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {/* ══ Images ══ */}
        <Section title="Product Images">
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Slot
                key={i}
                id={`image${i + 1}`}
                isMain={i === 0}
                existingUrl={existingImages[i]}
                preview={newPreviews[i]}
                onChange={handleImage(i)}
              />
            ))}
          </div>
          <Err msg={errors.images} />
          <p className="text-[11px] text-gray-400">
            Click any slot to replace. Images without a{' '}
            <span className="font-semibold text-blue-600">NEW</span> badge keep their current URL.
          </p>
        </Section>

        {/* ══ Tabs ══ */}
        <div className="flex border-b border-gray-100 gap-1">
          {TABS.map(({ key, label: tabLabel }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-xs font-semibold tracking-wide transition-all border-b-2 -mb-px
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
                <label className={lbl}>Product Name *</label>
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
                <label className={lbl}>Description *</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((p) => ({ ...p, desc: undefined }));
                  }}
                  placeholder="Describe the product…"
                  className={`${field} resize-none`}
                />
                <div className="flex items-center justify-between">
                  <Err msg={errors.desc} />
                  <span className="text-[11px] text-gray-400 ml-auto mt-1">
                    {description.length} chars
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Category</label>
                  <SelectField
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={CATEGORIES}
                  />
                </div>
                <div>
                  <label className={lbl}>Sub-Category</label>
                  <SelectField
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    options={SUB_CATEGORIES}
                  />
                </div>
              </div>
              <div>
                <label className={lbl}>Tags</label>
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
                        className="text-gray-400 hover:text-gray-700"
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
                    className="flex-1 min-w-20 outline-none bg-transparent text-sm placeholder-gray-400"
                  />
                </div>
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
                    className={`w-12 py-2 text-sm border transition-all duration-150 rounded-sm
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
                  val: bestseller,
                  set: setBestseller,
                  title: 'Bestseller',
                  desc: 'Show in bestsellers section.',
                },
                {
                  val: featured,
                  set: setFeatured,
                  title: 'Featured Product',
                  desc: 'Highlighted in featured banners.',
                },
              ].map(({ val, set, title: t, desc: d }) => (
                <label key={t} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => set(!val)}
                    className={`w-4 h-4 mt-0.5 border flex items-center justify-center flex-shrink-0 transition-all rounded-sm
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Selling Price (₹) *</label>
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
                <label className={lbl}>Compare-at Price (MRP)</label>
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
                <label className={lbl}>SKU</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. WMN-TOP-001"
                  className={field}
                />
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
            <div>
              <label className={lbl}>Meta Title</label>
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
              <label className={lbl}>Meta Description</label>
              <textarea
                rows={3}
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                placeholder={description.slice(0, 160) || 'Brief description for search engines…'}
                className={`${field} resize-none`}
              />
              <p
                className={`text-[11px] mt-1 ${metaDesc.length > 160 ? 'text-red-400' : 'text-gray-400'}`}
              >
                {metaDesc.length} / 160 chars
              </p>
            </div>
            <div className="border border-gray-100 rounded-sm p-4 bg-gray-50">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Google Preview
              </p>
              <p className="text-blue-600 text-sm font-medium truncate">
                {metaTitle || name || 'Product Title'}
              </p>
              <p className="text-green-700 text-xs mt-0.5">
                yourstore.com › products ›{' '}
                {name.toLowerCase().replace(/\s+/g, '-') || 'product-slug'}
              </p>
              <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                {metaDesc ||
                  description.slice(0, 160) ||
                  'Your product description will appear here…'}
              </p>
            </div>
          </Section>
        )}

        {/* ══ Submit bar ══ */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gray-900 text-white px-7 py-2.5 text-sm font-medium hover:bg-black active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Changes
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/list')}
            className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-700 transition-colors rounded-sm"
          >
            Cancel
          </button>
          <span className="text-xs text-gray-400 ml-auto">
            {published ? 'Changes will go live immediately.' : 'Product is in draft.'}
          </span>
        </div>
      </form>
    </div>
  );
};

export default Edit;
