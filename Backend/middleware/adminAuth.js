import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token)
      return res.status(401).json({ success: false, message: 'Not authorised — please log in' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = typeof decoded === 'string' ? process.env.ADMIN_EMAIL : decoded?.email;
    req.adminEmail = email || 'admin';

    // Support both the legacy string payload and a proper { email } object payload
    const isValid =
      decoded === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD ||
      decoded?.email === process.env.ADMIN_EMAIL;

    if (!isValid)
      return res.status(403).json({ success: false, message: 'Not authorised — access denied' });

    next();
  } catch (error) {
    console.error('[adminAuth]', error.message);
    const message =
      error.name === 'TokenExpiredError' ? 'Session expired — please log in again' : error.message;
    return res.status(401).json({ success: false, message });
  }
};

export default adminAuth;
