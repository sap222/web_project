# Hospital Management System

A multi-tenant hospital management platform built with the MERN stack
(MongoDB, Express, React, Node.js).

## Implemented features

- Login with JWT and role-based access control (Super Admin, Hospital Admin, Doctor)
- Super Admin dashboard: system totals; add, activate, deactivate and delete hospitals
- Hospital Admin panel: hospital information, doctor management
- Patient registration and assignment to a doctor of the same hospital
- Doctor dashboard: assigned patients and their medical records
- Appointment management: book, reschedule, complete and cancel, with double-booking prevented

## Setup

Requires Node.js 20 or newer.

```bash
cd server
npm install
cp .env.example .env      # then fill in the values
SEED_PASSWORD=choose-a-password npm run seed
npm run dev
```

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 and sign in as `superadmin@hms.local` with the
password you chose. Create a hospital and its admin there, then sign in as
that admin to add doctors and patients.
