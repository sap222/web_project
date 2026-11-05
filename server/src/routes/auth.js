import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import { protect } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  hospital: u.hospital,
  specialization: u.specialization,
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new HttpError(400, 'Email and password are required');
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.checkPassword(password))) throw new HttpError(401, 'Invalid email or password');
    if (!user.active) throw new HttpError(403, 'Account is deactivated');
    if (user.hospital) {
      const hospital = await Hospital.findById(user.hospital).select('active');
      if (!hospital || !hospital.active) throw new HttpError(403, 'Hospital is deactivated');
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
