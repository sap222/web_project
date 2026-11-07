import mongoose from 'mongoose';

export const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled'];

const { ObjectId } = mongoose.Schema.Types;

const appointmentSchema = new mongoose.Schema(
  {
    hospital: { type: ObjectId, ref: 'Hospital', required: true, index: true },
    patient: { type: ObjectId, ref: 'Patient', required: true, index: true },
    doctor: { type: ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'scheduled' },
  },
  { timestamps: true }
);

// The database itself prevents double-booking a doctor, even for simultaneous requests.
appointmentSchema.index(
  { doctor: 1, date: 1 },
  { unique: true, partialFilterExpression: { status: 'scheduled' } }
);

export default mongoose.model('Appointment', appointmentSchema);
