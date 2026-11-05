import { Router } from 'express';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { protect, allow } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { pick } from '../utils/pick.js';

const router = Router();
router.use(protect);

const FIELDS = ['name', 'address', 'phone', 'email'];

// Hospital admin: own hospital
router.get('/mine', allow('hospital_admin'), async (req, res, next) => {
  try {
    res.json(await Hospital.findById(req.user.hospital));
  } catch (err) {
    next(err);
  }
});

router.put('/mine', allow('hospital_admin'), async (req, res, next) => {
  try {
    const updated = await Hospital.findByIdAndUpdate(req.user.hospital, pick(req.body, FIELDS), {
      new: true,
      runValidators: true,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Super admin: all hospitals
router.use(allow('super_admin'));

router.get('/', async (_req, res, next) => {
  try {
    const hospitals = await Hospital.find().sort({ createdAt: -1 }).lean();
    const admins = await User.find({ role: 'hospital_admin' }).select('name email hospital').lean();
    res.json(
      hospitals.map((h) => ({
        ...h,
        admin: admins.find((a) => String(a.hospital) === String(h._id)) || null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Creates the hospital and its first admin together.
router.post('/', async (req, res, next) => {
  let hospital;
  try {
    const { admin } = req.body;
    if (!admin?.name || !admin?.email || !admin?.password) {
      throw new HttpError(400, 'Admin name, email and password are required');
    }
    hospital = await Hospital.create(pick(req.body, FIELDS));
    await User.create({
      name: admin.name,
      email: admin.email,
      password: admin.password,
      role: 'hospital_admin',
      hospital: hospital._id,
    });
    res.status(201).json(hospital);
  } catch (err) {
    if (hospital) await Hospital.findByIdAndDelete(hospital._id);
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const update = pick(req.body, [...FIELDS, 'active']);
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!hospital) throw new HttpError(404, 'Hospital not found');
    res.json(hospital);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) throw new HttpError(404, 'Hospital not found');
    await Promise.all([User.deleteMany({ hospital: hospital._id }), Patient.deleteMany({ hospital: hospital._id })]);
    res.json({ message: 'Hospital deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
