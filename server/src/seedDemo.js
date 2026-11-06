// Adds demo hospitals, admins, doctors and patients. Safe to run more than once:
// a hospital that already exists is skipped.
// Requires DEMO_PASSWORD in the environment; every demo account uses it.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Hospital from './models/Hospital.js';
import User from './models/User.js';
import Patient from './models/Patient.js';

const password = process.env.DEMO_PASSWORD;

if (!password || password.length < 6) {
  console.error('Set DEMO_PASSWORD (at least 6 characters)');
  process.exit(1);
}

const SUPER_ADMINS = [{ name: 'Hina Malik', email: 'hina.super@hms.local' }];

const HOSPITALS = [
  {
    name: 'City General Hospital',
    address: '12 Jail Road, Lahore',
    phone: '042-35550101',
    email: 'info@citygeneral.local',
    admin: { name: 'Usman Tariq', email: 'admin@citygeneral.local' },
    doctors: [
      { name: 'Sara Khan', email: 'sara@citygeneral.local', specialization: 'Cardiology', phone: '0300-1110001' },
      { name: 'Ahmed Raza', email: 'ahmed@citygeneral.local', specialization: 'Orthopedics', phone: '0300-1110002' },
    ],
    patients: [
      { name: 'Bilal Ahmed', age: 45, gender: 'male', phone: '0311-2220001', address: 'Model Town, Lahore', doctor: 0 },
      { name: 'Ayesha Noor', age: 62, gender: 'female', phone: '0311-2220002', address: 'Gulberg, Lahore', doctor: 0 },
      { name: 'Hamza Ali', age: 28, gender: 'male', phone: '0311-2220003', address: 'Johar Town, Lahore', doctor: 1 },
      { name: 'Zainab Bibi', age: 54, gender: 'female', phone: '0311-2220004', address: 'Garden Town, Lahore', doctor: 1 },
      { name: 'Imran Shah', age: 37, gender: 'male', phone: '0311-2220005', address: 'Iqbal Town, Lahore', doctor: null },
    ],
  },
  {
    name: 'Sunrise Medical Center',
    address: '45 Shahrah-e-Faisal, Karachi',
    phone: '021-34440202',
    email: 'info@sunrise.local',
    admin: { name: 'Nadia Hussain', email: 'admin@sunrise.local' },
    doctors: [
      { name: 'Farhan Siddiqui', email: 'farhan@sunrise.local', specialization: 'Neurology', phone: '0321-3330001' },
      { name: 'Mariam Qureshi', email: 'mariam@sunrise.local', specialization: 'Pediatrics', phone: '0321-3330002' },
    ],
    patients: [
      { name: 'Omar Farooq', age: 51, gender: 'male', phone: '0333-4440001', address: 'Clifton, Karachi', doctor: 0 },
      { name: 'Fatima Zahra', age: 8, gender: 'female', phone: '0333-4440002', address: 'DHA, Karachi', doctor: 1 },
      { name: 'Ali Hassan', age: 11, gender: 'male', phone: '0333-4440003', address: 'Nazimabad, Karachi', doctor: 1 },
      { name: 'Rabia Khan', age: 39, gender: 'female', phone: '0333-4440004', address: 'Gulshan, Karachi', doctor: null },
    ],
  },
  {
    name: 'Green Valley Hospital',
    address: '7 Blue Area, Islamabad',
    phone: '051-22230303',
    email: 'info@greenvalley.local',
    admin: { name: 'Kamran Javed', email: 'admin@greenvalley.local' },
    doctors: [
      { name: 'Sana Iqbal', email: 'sana@greenvalley.local', specialization: 'Dermatology', phone: '0345-5550001' },
      { name: 'Yasir Mehmood', email: 'yasir@greenvalley.local', specialization: 'General Medicine', phone: '0345-5550002' },
    ],
    patients: [
      { name: 'Hassan Raza', age: 33, gender: 'male', phone: '0301-6660001', address: 'F-10, Islamabad', doctor: 0 },
      { name: 'Maryam Aslam', age: 26, gender: 'female', phone: '0301-6660002', address: 'G-11, Islamabad', doctor: 1 },
      { name: 'Tariq Mahmood', age: 70, gender: 'male', phone: '0301-6660003', address: 'I-8, Islamabad', doctor: 1 },
    ],
  },
];

await connectDB();

for (const admin of SUPER_ADMINS) {
  if (!(await User.exists({ email: admin.email }))) {
    await User.create({ ...admin, password, role: 'super_admin' });
    console.log(`Created super admin ${admin.email}`);
  }
}

for (const { admin, doctors, patients, ...details } of HOSPITALS) {
  if (await Hospital.exists({ name: details.name })) {
    console.log(`Skipped ${details.name} (already exists)`);
    continue;
  }
  const hospital = await Hospital.create(details);
  await User.create({ ...admin, password, role: 'hospital_admin', hospital: hospital._id });

  const createdDoctors = [];
  for (const doctor of doctors) {
    createdDoctors.push(await User.create({ ...doctor, password, role: 'doctor', hospital: hospital._id }));
  }

  await Patient.insertMany(
    patients.map(({ doctor, ...patient }) => ({
      ...patient,
      hospital: hospital._id,
      doctor: doctor === null ? null : createdDoctors[doctor]._id,
    }))
  );
  console.log(`Created ${details.name}: 1 admin, ${doctors.length} doctors, ${patients.length} patients`);
}

await mongoose.disconnect();
