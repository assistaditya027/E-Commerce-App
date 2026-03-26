import mongoose from 'mongoose';
import validator from 'validator';

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      validate: {
        validator: (val) => validator.isEmail(val || ''),
        message: 'Invalid email',
      },
    },
    status: {
      type: String,
      enum: ['subscribed', 'unsubscribed'],
      default: 'subscribed',
    },
    source: {
      type: String,
      default: 'web',
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

const newsletterModel =
  mongoose.models.newsletter || mongoose.model('newsletter', newsletterSchema);

export default newsletterModel;
