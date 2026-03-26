import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // ── Core ─────────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    image: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: (v) => v.length >= 1,
        message: 'At least one image URL is required',
      },
    },

    // ── Categorisation ───────────────────────────────────────────────────────
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Men', 'Women', 'Kids'],
    },
    subCategory: {
      type: String,
      required: [true, 'Sub-category is required'],
      enum: ['Topwear', 'Bottomwear', 'Winterwear'],
    },
    sizes: {
      type: [String],
      required: [true, 'Sizes are required'],
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    },
    tags: {
      type: [String],
      default: [],
    },

    // ── Pricing ──────────────────────────────────────────────────────────────
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    comparePrice: {
      type: Number,
      default: null,
      min: [0, 'Compare price cannot be negative'],
    },

    // ── Inventory ────────────────────────────────────────────────────────────
    sku: {
      type: String,
      default: '',
      trim: true,
    },
    // stock is now a Map: { "S": 10, "M": 0, "L": 8 }
    stock: {
      type: Map,
      of: Number,
      default: {},
    },

    // ── Flags ────────────────────────────────────────────────────────────────
    bestSeller: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: true,
    },

    // ── SEO ──────────────────────────────────────────────────────────────────
    metaTitle: {
      type: String,
      default: '',
      maxlength: [60, 'Meta title should be 60 characters or fewer'],
    },
    metaDesc: {
      type: String,
      default: '',
      maxlength: [160, 'Meta description should be 160 characters or fewer'],
    },

    // ── Timestamps ───────────────────────────────────────────────────────────
    date: {
      type: Number,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ──────────────────────────────────────────────────────────────────
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ bestSeller: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ published: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// ── Virtual: discount percentage ─────────────────────────────────────────────
productSchema.virtual('discountPct').get(function () {
  if (this.comparePrice && this.comparePrice > this.price)
    return Math.round((1 - this.price / this.comparePrice) * 100);
  return 0;
});

// ── Virtual: inStock — true if ANY size has stock > 0 ────────────────────────
productSchema.virtual('inStock').get(function () {
  if (!this.stock || this.stock.size === 0) return false;
  for (const qty of this.stock.values()) {
    if (qty > 0) return true;
  }
  return false;
});

const productModel = mongoose.models.product || mongoose.model('product', productSchema);

export default productModel;
