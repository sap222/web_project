// Sets a new password for an existing account.
// Usage: node src/setPassword.js <email> <new-password>
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';

const [email, password] = process.argv.slice(2);

if (!email || !password || password.length < 6) {
  console.error('Usage: node src/setPassword.js <email> <new-password (at least 6 characters)>');
  process.exit(1);
}

await connectDB();
const user = await User.findOne({ email: email.toLowerCase().trim() });
if (user) {
  user.password = password;
  await user.save();
  console.log(`Password set for ${user.email}`);
} else {
  console.log(`No user with email ${email}`);
}
await mongoose.disconnect();
