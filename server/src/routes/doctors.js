import { Router } from 'express';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { protect, allow } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { pick } from '../utils/pick.js';

const router = Router();
router.use(protect, allow('hospital_admin'));

// Every query is scoped to the admin's own hospital, taken from the session.
const scope = (req, extra = {}) => ({ ...extra, role: 'doctor', hospital: req.user.hospital });

const withoutPassword = (doc) => {
  const { password: _password, ...safe } = doc.toObject();
  return safe;
};

router.get('/', async (req, res, next) => {
  try {
    res.json(await User.find(scope(req)).sort({ name: 1 }));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body.specialization) throw new HttpError(400, 'Specialization is required');
    const doctor = await User.create({
      ...pick(req.body, ['name', 'email', 'password', 'specialization', 'phone']),
      role: 'doctor',
      hospital: req.user.hospital,
    });
    res.status(201).json(withoutPassword(doctor));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const doctor = await User.findOne(scope(req, { _id: req.params.id }));
    if (!doctor) throw new HttpError(404, 'Doctor not found');
    Object.assign(doctor, pick(req.body, ['name', 'email', 'specialization', 'phone', 'active']));
    if (req.body.password) doctor.password = req.body.password;
    await doctor.save();
    res.json(withoutPassword(doctor));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const doctor = await User.findOneAndDelete(scope(req, { _id: req.params.id }));
    if (!doctor) throw new HttpError(404, 'Doctor not found');
    await Patient.updateMany({ doctor: doctor._id }, { doctor: null });
    res.json({ message: 'Doctor removed' });
  } catch (err) {
    next(err);
  }
});

export default router;
