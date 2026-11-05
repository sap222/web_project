import { Router } from 'express';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/system', allow('super_admin'), async (_req, res, next) => {
  try {
    const [hospitals, activeHospitals, doctors, patients] = await Promise.all([
      Hospital.countDocuments(),
      Hospital.countDocuments({ active: true }),
      User.countDocuments({ role: 'doctor' }),
      Patient.countDocuments(),
    ]);
    res.json({ hospitals, activeHospitals, doctors, patients });
  } catch (err) {
    next(err);
  }
});

router.get('/hospital', allow('hospital_admin'), async (req, res, next) => {
  try {
    const hospital = req.user.hospital;
    const [doctors, patients, unassigned] = await Promise.all([
      User.countDocuments({ role: 'doctor', hospital }),
      Patient.countDocuments({ hospital }),
      Patient.countDocuments({ hospital, doctor: null }),
    ]);
    res.json({ doctors, patients, unassigned });
  } catch (err) {
    next(err);
  }
});

export default router;
