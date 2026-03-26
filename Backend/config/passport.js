import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import userModel from '../models/userModel.js';

const normalizeEmail = (email) =>
  String(email || '')
    .trim()
    .toLowerCase();

const fallbackName = (email, profile) => {
  if (profile?.displayName) return profile.displayName;
  if (profile?.username) return profile.username;
  if (email) return email.split('@')[0];
  return 'User';
};

const findOrCreateOAuthUser = async ({ provider, providerId, email, name, avatar }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    const error = new Error('Email not available from provider');
    error.code = 'OAUTH_EMAIL_MISSING';
    throw error;
  }

  const providerField = provider === 'google' ? 'oauth.googleId' : 'oauth.githubId';

  let user = await userModel.findOne({ [providerField]: providerId });
  if (user) {
    user.oauth = user.oauth || {};
    user.oauth.lastLoginProvider = provider;
    if (avatar && !user.avatar) user.avatar = avatar;
    if (name && !user.name) user.name = name;
    await user.save();
    return user;
  }

  user = await userModel.findOne({ email: normalizedEmail });
  if (user) {
    user.oauth = user.oauth || {};
    if (provider === 'google' && !user.oauth.googleId) user.oauth.googleId = providerId;
    if (provider === 'github' && !user.oauth.githubId) user.oauth.githubId = providerId;
    user.oauth.lastLoginProvider = provider;
    if (avatar && !user.avatar) user.avatar = avatar;
    if (name && !user.name) user.name = name;
    await user.save();
    return user;
  }

  const randomPassword = crypto.randomBytes(32).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(randomPassword, salt);

  const newUser = new userModel({
    name: name || fallbackName(normalizedEmail, null),
    email: normalizedEmail,
    password: hashedPassword,
    avatar: avatar || '',
    oauth: {
      googleId: provider === 'google' ? providerId : '',
      githubId: provider === 'github' ? providerId : '',
      lastLoginProvider: provider,
    },
  });

  return newUser.save();
};

const configurePassport = (passport) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

  if (googleClientId && googleClientSecret && googleCallbackUrl) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: googleCallbackUrl,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile?.emails?.[0]?.value;
            const name = fallbackName(email, profile);
            const avatar = profile?.photos?.[0]?.value || '';
            const user = await findOrCreateOAuthUser({
              provider: 'google',
              providerId: profile.id,
              email,
              name,
              avatar,
            });
            done(null, user);
          } catch (error) {
            done(error);
          }
        },
      ),
    );
  } else {
    console.warn('[oauth] Google OAuth is not configured (missing env vars).');
  }

  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
  const githubCallbackUrl = process.env.GITHUB_CALLBACK_URL;

  if (githubClientId && githubClientSecret && githubCallbackUrl) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: githubClientId,
          clientSecret: githubClientSecret,
          callbackURL: githubCallbackUrl,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile?.emails?.[0]?.value;
            const name = fallbackName(email, profile);
            const avatar = profile?.photos?.[0]?.value || '';
            const user = await findOrCreateOAuthUser({
              provider: 'github',
              providerId: profile.id,
              email,
              name,
              avatar,
            });
            done(null, user);
          } catch (error) {
            done(error);
          }
        },
      ),
    );
  } else {
    console.warn('[oauth] GitHub OAuth is not configured (missing env vars).');
  }
};

export default configurePassport;
