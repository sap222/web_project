import { Router } from 'express';
import MedicalRecord from '../models/MedicalRecord.js';
import Patient from '../models/Patient.js';
import { protect, allow } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { pick } from '../utils/pick.js';

const router = Router();
router.use(protect, allow('doctor'));

const FIELDS = ['visitDate', 'diagnosis', 'symptoms', 'prescription', 'notes'];

async function findOwnPatient(req, patientId) {
  const patient = await Patient.findOne({ _id: patientId, doctor: req.user._id, hospital: req.user.hospital });
  if (!patient) throw new HttpError(404, 'Patient not found');
  return patient;
}

// A doctor can change only records they wrote, for patients still assigned to them.
async function findEditableRecord(req) {
  const record = await MedicalRecord.findOne({ _id: req.params.id, doctor: req.user._id, hospital: req.user.hospital });
  if (!record) throw new HttpError(404, 'Record not found');
  await findOwnPatient(req, record.patient);
  return record;
}

// A doctor reads the patient's full history, including notes from previous doctors.
router.get('/patient/:patientId', async (req, res, next) => {
  try {
    const patient = await findOwnPatient(req, req.params.patientId);
    const records = await MedicalRecord.find({ patient: patient._id, hospital: req.user.hospital })
      .populate('doctor', 'name specialization')
      .sort({ visitDate: -1, createdAt: -1 });
    res.json({ patient, records });
  } catch (err) {
    next(err);
  }
});

router.post('/patient/:patientId', async (req, res, next) => {
  try {
    const patient = await findOwnPatient(req, req.params.patientId);
    const record = await MedicalRecord.create({
      ...pick(req.body, FIELDS),
      patient: patient._id,
      doctor: req.user._id,
      hospital: req.user.hospital,
    });
    res.status(201).json(await record.populate('doctor', 'name specialization'));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const record = await findEditableRecord(req);
    Object.assign(record, pick(req.body, FIELDS));
    await record.save();
    res.json(await record.populate('doctor', 'name specialization'));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const record = await findEditableRecord(req);
    await record.deleteOne();
    res.json({ message: 'Record deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
