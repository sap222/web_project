import { Router } from 'express';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const upcoming = (filter) => Appointment.countDocuments({ ...filter, status: 'scheduled', date: { $gte: new Date() } });

router.get('/system', allow('super_admin'), async (_req, res, next) => {
  try {
    const [hospitals, activeHospitals, doctors, patients, appointments] = await Promise.all([
      Hospital.countDocuments(),
      Hospital.countDocuments({ active: true }),
      User.countDocuments({ role: 'doctor' }),
      Patient.countDocuments(),
      upcoming({}),
    ]);
    res.json({ hospitals, activeHospitals, doctors, patients, appointments });
  } catch (err) {
    next(err);
  }
});

router.get('/hospital', allow('hospital_admin'), async (req, res, next) => {
  try {
    const hospital = req.user.hospital;
    const [doctors, patients, unassigned, appointments] = await Promise.all([
      User.countDocuments({ role: 'doctor', hospital }),
      Patient.countDocuments({ hospital }),
      Patient.countDocuments({ hospital, doctor: null }),
      upcoming({ hospital }),
    ]);
    res.json({ doctors, patients, unassigned, appointments });
  } catch (err) {
    next(err);
  }
});

router.get('/doctor', allow('doctor'), async (req, res, next) => {
  try {
    const doctor = req.user._id;
    const [patients, appointments, records] = await Promise.all([
      Patient.countDocuments({ doctor }),
      upcoming({ doctor }),
      MedicalRecord.countDocuments({ doctor }),
    ]);
    res.json({ patients, appointments, records });
  } catch (err) {
    next(err);
  }
});

export default router;
