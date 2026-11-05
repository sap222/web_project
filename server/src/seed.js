// Creates the Super Admin account. Safe to run more than once.
// Requires SEED_PASSWORD in the environment; SEED_EMAIL is optional.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';

const email = process.env.SEED_EMAIL || 'superadmin@hms.local';
const password = process.env.SEED_PASSWORD;

if (!password || password.length < 6) {
  console.error('Set SEED_PASSWORD (at least 6 characters)');
  process.exit(1);
}

await connectDB();
const existing = await User.findOne({ email });
if (existing) {
  console.log(`Super admin already exists: ${email}`);
} else {
  await User.create({ name: 'Super Admin', email, password, role: 'super_admin' });
  console.log(`Super admin created: ${email}`);
}
await mongoose.disconnect();
