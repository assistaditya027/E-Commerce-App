import validator from 'validator';
import newsletterModel from '../models/newsletterModel.js';
import { logError, logInfo } from '../utils/logger.js';

const subscribe = async (req, res) => {
  try {
    const emailRaw = req.body?.email || '';
    const email = String(emailRaw).trim().toLowerCase();

    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!validator.isEmail(email))
      return res.status(400).json({ success: false, message: 'Invalid email' });

    const existing = await newsletterModel.findOne({ email });
    if (existing) {
      if (existing.status !== 'subscribed') {
        existing.status = 'subscribed';
        await existing.save();
      }
      logInfo('newsletter.subscribe.exists', { email });
      return res.json({ success: true, message: 'Already subscribed' });
    }

    await newsletterModel.create({
      email,
      source: 'web',
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
    });

    logInfo('newsletter.subscribe.created', { email });
    return res.status(201).json({ success: true, message: 'Subscribed' });
  } catch (error) {
    if (error?.code === 11000) return res.json({ success: true, message: 'Already subscribed' });
    logError('newsletter.subscribe.error', { message: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const emailRaw = req.body?.email || '';
    const email = String(emailRaw).trim().toLowerCase();

    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!validator.isEmail(email))
      return res.status(400).json({ success: false, message: 'Invalid email' });

    const existing = await newsletterModel.findOne({ email });
    if (!existing) {
      logInfo('newsletter.unsubscribe.missing', { email });
      return res.json({ success: true, message: 'Unsubscribed' });
    }

    if (existing.status !== 'unsubscribed') {
      existing.status = 'unsubscribed';
      await existing.save();
    }

    logInfo('newsletter.unsubscribe.updated', { email });
    return res.json({ success: true, message: 'Unsubscribed' });
  } catch (error) {
    logError('newsletter.unsubscribe.error', { message: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { subscribe, unsubscribe };
