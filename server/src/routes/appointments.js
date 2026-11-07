import { Router } from 'express';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { protect, allow } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { pick } from '../utils/pick.js';

const router = Router();
router.use(protect, allow('hospital_admin', 'doctor'));

const SLOT_MS = 15 * 60 * 1000;
const POPULATE = [
  { path: 'patient', select: 'name phone' },
  { path: 'doctor', select: 'name specialization' },
];

// Admins see their whole hospital; doctors see only their own appointments.
const scope = (req, extra = {}) => ({
  ...extra,
  hospital: req.user.hospital,
  ...(req.user.role === 'doctor' ? { doctor: req.user._id } : {}),
});

function parseSlot(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new HttpError(400, 'A valid date and time is required');
  if (date.getTime() % SLOT_MS !== 0) throw new HttpError(400, 'Appointments must start on a 15 minute slot');
  if (date.getTime() <= Date.now()) throw new HttpError(400, 'Appointment must be in the future');
  return date;
}

async function saveAppointment(appointment) {
  try {
    await appointment.save();
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'The doctor already has an appointment at this time');
    throw err;
  }
}

router.get('/', async (req, res, next) => {
  try {
    res.json(await Appointment.find(scope(req)).populate(POPULATE).sort({ date: 1 }));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (typeof req.body.patient !== 'string') throw new HttpError(400, 'Patient is required');
    const filter = { _id: req.body.patient, hospital: req.user.hospital };
    if (req.user.role === 'doctor') filter.doctor = req.user._id;
    const patient = await Patient.findOne(filter);
    if (!patient) throw new HttpError(404, 'Patient not found');
    if (!patient.doctor) throw new HttpError(400, 'Assign a doctor to this patient first');
    if (!(await User.exists({ _id: patient.doctor, active: true }))) {
      throw new HttpError(400, 'The assigned doctor is not active');
    }

    const appointment = new Appointment({
      hospital: req.user.hospital,
      patient: patient._id,
      doctor: patient.doctor,
      date: parseSlot(req.body.date),
      reason: req.body.reason,
    });
    await saveAppointment(appointment);
    res.status(201).json(await appointment.populate(POPULATE));
  } catch (err) {
    next(err);
  }
});

// Reschedules, completes or cancels. Completed and cancelled appointments are final.
router.put('/:id', async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne(scope(req, { _id: req.params.id }));
    if (!appointment) throw new HttpError(404, 'Appointment not found');
    if (appointment.status !== 'scheduled') throw new HttpError(400, 'Only scheduled appointments can be changed');

    Object.assign(appointment, pick(req.body, ['reason', 'status']));
    if (req.body.date !== undefined) appointment.date = parseSlot(req.body.date);
    await saveAppointment(appointment);
    res.json(await appointment.populate(POPULATE));
  } catch (err) {
    next(err);
  }
});

export default router;
