import { Router } from 'express';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { protect, allow } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { pick } from '../utils/pick.js';

const router = Router();
router.use(protect);

const DOCTOR_FIELDS = 'name specialization';
const FIELDS = ['name', 'age', 'gender', 'phone', 'address'];

// A patient may only be assigned to a doctor of the same hospital.
async function resolveDoctor(req) {
  const id = req.body.doctor;
  if (!id) return null;
  const doctor = await User.findOne({ _id: id, role: 'doctor', hospital: req.user.hospital });
  if (!doctor) throw new HttpError(400, 'Doctor does not belong to this hospital');
  return doctor._id;
}

// Doctors see only their own patients, read-only.
router.get('/mine', allow('doctor'), async (req, res, next) => {
  try {
    res.json(await Patient.find({ doctor: req.user._id, hospital: req.user.hospital }).sort({ name: 1 }));
  } catch (err) {
    next(err);
  }
});

router.use(allow('hospital_admin'));

router.get('/', async (req, res, next) => {
  try {
    res.json(
      await Patient.find({ hospital: req.user.hospital }).populate('doctor', DOCTOR_FIELDS).sort({ createdAt: -1 })
    );
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const doctor = await resolveDoctor(req);
    const patient = await Patient.create({ ...pick(req.body, FIELDS), doctor, hospital: req.user.hospital });
    res.status(201).json(await patient.populate('doctor', DOCTOR_FIELDS));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const update = pick(req.body, FIELDS);
    if ('doctor' in req.body) update.doctor = await resolveDoctor(req);
    const patient = await Patient.findOneAndUpdate({ _id: req.params.id, hospital: req.user.hospital }, update, {
      new: true,
      runValidators: true,
    }).populate('doctor', DOCTOR_FIELDS);
    if (!patient) throw new HttpError(404, 'Patient not found');
    res.json(patient);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const patient = await Patient.findOneAndDelete({ _id: req.params.id, hospital: req.user.hospital });
    if (!patient) throw new HttpError(404, 'Patient not found');
    res.json({ message: 'Patient removed' });
  } catch (err) {
    next(err);
  }
});

export default router;
