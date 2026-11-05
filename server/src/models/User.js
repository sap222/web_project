import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['super_admin', 'hospital_admin', 'doctor'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', index: true },
    specialization: { type: String, trim: true },
    phone: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('validate', function requireHospital(next) {
  if (this.role !== 'super_admin' && !this.hospital) {
    this.invalidate('hospital', 'Hospital is required for this role');
  }
  next();
});

userSchema.pre('save', async function hashPassword(next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.checkPassword = function checkPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
