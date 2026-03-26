import userModel from '../models/userModel.js';
import newsletterModel from '../models/newsletterModel.js';
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createToken } from '../utils/jwt.js';

// Routes for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "user doesn't exists" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = createToken(user._id);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Routes for user registration
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // checking user already existes or not
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: 'user already exists' });
    }

    // validating email format & strong password
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: 'Please enter a valid email' });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: 'Please enter a strong password' });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();

    const token = createToken(user._id);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Routes for admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });

    const user = await userModel.findById(userId).select('name email createdAt updatedAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newsletter = await newsletterModel.findOne({ email: user.email });
    const newsletterStatus = newsletter?.status || 'unsubscribed';

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      newsletterStatus,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });

    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ success: false, message: 'Name and email are required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();

    if (!validator.isEmail(normalizedEmail))
      return res.status(400).json({ success: false, message: 'Invalid email' });

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const oldEmail = user.email;
    if (normalizedEmail !== oldEmail) {
      const exists = await userModel.findOne({ email: normalizedEmail });
      if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    user.name = normalizedName;
    user.email = normalizedEmail;
    await user.save();

    if (oldEmail !== normalizedEmail) {
      const existingNewsletter = await newsletterModel.findOne({ email: oldEmail });
      if (existingNewsletter) {
        const target = await newsletterModel.findOne({ email: normalizedEmail });
        if (target) {
          if (existingNewsletter.status === 'subscribed' && target.status !== 'subscribed') {
            target.status = 'subscribed';
            await target.save();
          }
          await newsletterModel.deleteOne({ _id: existingNewsletter._id });
        } else {
          existingNewsletter.email = normalizedEmail;
          await existingNewsletter.save();
        }
      }
    }

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authorized' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res
        .status(400)
        .json({ success: false, message: 'Current and new password are required' });
    if (String(newPassword).length < 8)
      return res
        .status(400)
        .json({ success: false, message: 'Password must be at least 8 characters' });

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const firstUrl = (val) =>
  String(val || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)[0];

const buildResetLink = (req, token, email) => {
  const base = firstUrl(process.env.FRONTEND_URL) || req.headers.origin || 'http://localhost:5173';
  const encodedEmail = encodeURIComponent(email);
  return `${base}/reset-password?token=${token}&email=${encodedEmail}`;
};

const sendResetEmail = async (to, resetLink) => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'no-reply@example.com';

  if (!host || !user || !pass) return false;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const html = `
      <div style="font-family: Arial, sans-serif; color:#111; line-height:1.5; max-width:560px; margin:0 auto;">
        <div style="padding:24px 24px 8px;">
          <h2 style="margin:0 0 8px; font-size:20px;">Reset your password</h2>
          <p style="margin:0 0 16px; color:#555;">We received a request to reset your password. Click the button below to continue.</p>
          <a href="${resetLink}" style="display:inline-block; background:#111; color:#fff; text-decoration:none; padding:10px 16px; border-radius:6px; font-size:14px;">
            Reset Password
          </a>
          <p style="margin:16px 0 0; font-size:12px; color:#777;">
            This link will expire in 1 hour. If you didn’t request this, you can safely ignore this email.
          </p>
        </div>
        <div style="padding:0 24px 24px; font-size:12px; color:#999;">
          <p style="margin:16px 0 6px;">Having trouble? Copy and paste this URL into your browser:</p>
          <p style="margin:0; word-break:break-all;">
            <a href="${resetLink}" style="color:#555; text-decoration:underline;">${resetLink}</a>
          </p>
        </div>
      </div>
    `;

  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your password',
    text: `Reset your password: ${resetLink}`,
    html,
  });

  return true;
};

const forgotPassword = async (req, res) => {
  try {
    const emailRaw = req.body?.email || '';
    const email = String(emailRaw).trim().toLowerCase();

    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!validator.isEmail(email))
      return res.status(400).json({ success: false, message: 'Invalid email' });

    const user = await userModel.findOne({ email });

    // Always respond success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetLink = buildResetLink(req, token, email);
    const emailed = await sendResetEmail(email, resetLink);

    if (emailed) {
      return res.json({ success: true, message: 'Reset link sent to your email.' });
    }

    // Dev fallback if SMTP not configured
    return res.json({
      success: true,
      message: 'Reset link generated (email not configured).',
      resetUrl: resetLink,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword)
      return res
        .status(400)
        .json({ success: false, message: 'Token, email, and new password are required' });
    if (!validator.isEmail(String(email)))
      return res.status(400).json({ success: false, message: 'Invalid email' });
    if (String(newPassword).length < 8)
      return res
        .status(400)
        .json({ success: false, message: 'Password must be at least 8 characters' });

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

    const user = await userModel.findOne({
      email: String(email).trim().toLowerCase(),
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = '';
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  loginUser,
  registerUser,
  adminLogin,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
