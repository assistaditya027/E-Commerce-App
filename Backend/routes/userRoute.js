import express from 'express';
import passport from 'passport';
import {
  registerUser,
  loginUser,
  adminLogin,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/userController.js';
import authUser from '../middleware/auth.js';
import { createToken } from '../utils/jwt.js';

const userRouter = express.Router();

const firstUrl = (val) =>
  String(val || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)[0];

const frontendBase = (req) =>
  firstUrl(process.env.FRONTEND_URL) || req.headers.origin || 'http://localhost:5173';

const sanitizeRedirect = (val) => {
  const text = String(val || '').trim();
  if (!text || text.length > 200) return '/';
  if (!text.startsWith('/') || text.startsWith('//')) return '/';
  return text;
};

const decodeState = (val) => {
  try {
    return decodeURIComponent(String(val || ''));
  } catch {
    return '';
  }
};

const getRedirectFromState = (req) => sanitizeRedirect(decodeState(req.query?.state));

const hasStrategy = (name) => {
  if (typeof passport._strategy === 'function') return !!passport._strategy(name);
  return !!passport._strategies?.[name];
};

const startOAuth =
  (provider, options = {}) =>
  (req, res, next) => {
    if (!hasStrategy(provider)) {
      const base = frontendBase(req);
      return res.redirect(`${base}/login?oauth=missing&provider=${provider}`);
    }
    const redirect = sanitizeRedirect(req.query?.redirect);
    const state = redirect;
    return passport.authenticate(provider, { ...options, state })(req, res, next);
  };

const finishOAuth = (provider) => (req, res, next) => {
  const base = frontendBase(req);
  const redirect = getRedirectFromState(req);

  return passport.authenticate(provider, { session: false }, (err, user) => {
    if (err || !user) {
      const reason = err?.code === 'OAUTH_EMAIL_MISSING' ? 'email' : 'failed';
      return res.redirect(
        `${base}/login?oauth=${reason}&provider=${provider}&redirect=${encodeURIComponent(redirect)}`,
      );
    }
    const token = createToken(user._id);
    return res.redirect(
      `${base}/oauth/callback?token=${encodeURIComponent(token)}&provider=${provider}&redirect=${encodeURIComponent(redirect)}`,
    );
  })(req, res, next);
};

// User registration route
userRouter.post('/register', registerUser);
// User login route
userRouter.post('/login', loginUser);
// Admin login route
userRouter.post('/admin/login', adminLogin);
userRouter.get('/me', authUser, getProfile);
userRouter.patch('/me', authUser, updateProfile);
userRouter.post('/change-password', authUser, changePassword);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/reset-password', resetPassword);
userRouter.get('/oauth/google', startOAuth('google', { scope: ['profile', 'email'] }));
userRouter.get('/oauth/google/callback', finishOAuth('google'));
userRouter.get('/oauth/github', startOAuth('github', { scope: ['user:email'] }));
userRouter.get('/oauth/github/callback', finishOAuth('github'));

export default userRouter;
