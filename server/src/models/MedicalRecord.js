import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;
const ONE_DAY = 24 * 60 * 60 * 1000;

const medicalRecordSchema = new mongoose.Schema(
  {
    hospital: { type: ObjectId, ref: 'Hospital', required: true, index: true },
    patient: { type: ObjectId, ref: 'Patient', required: true, index: true },
    doctor: { type: ObjectId, ref: 'User', required: true, index: true },
    visitDate: {
      type: Date,
      required: true,
      // One day of slack allows for time zones ahead of the server.
      validate: { validator: (v) => v.getTime() <= Date.now() + ONE_DAY, message: 'Visit date cannot be in the future' },
    },
    diagnosis: { type: String, required: true, trim: true },
    symptoms: { type: String, trim: true },
    prescription: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('MedicalRecord', medicalRecordSchema);
