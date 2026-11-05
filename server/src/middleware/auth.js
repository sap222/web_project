import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import { HttpError } from './error.js';

export async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw new HttpError(401, 'Not authenticated');

    let payload;
    try {
      payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    } catch {
      throw new HttpError(401, 'Session expired or invalid');
    }

    // Load from the database so a deactivated account loses access immediately.
    const user = await User.findById(payload.id);
    if (!user || !user.active) throw new HttpError(401, 'Account is not active');
    if (user.hospital) {
      const hospital = await Hospital.findById(user.hospital).select('active');
      if (!hospital || !hospital.active) throw new HttpError(403, 'Hospital is deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export const allow = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have access to this'));
  next();
};
