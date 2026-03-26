import mongoose from 'mongoose';

const userSchemema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    oauth: {
      googleId: { type: String, default: '' },
      githubId: { type: String, default: '' },
      lastLoginProvider: { type: String, default: '' },
    },
    resetPasswordToken: {
      type: String,
      default: '',
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    cartData: {
      type: Object,
      default: {},
    },
  },
  { minimize: false, timestamps: true },
);

const userModel = mongoose.models.user || mongoose.model('user', userSchemema);

export default userModel;
