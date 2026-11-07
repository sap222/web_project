import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import hospitalRoutes from './routes/hospitals.js';
import doctorRoutes from './routes/doctors.js';
import patientRoutes from './routes/patients.js';
import statsRoutes from './routes/stats.js';
import appointmentRoutes from './routes/appointments.js';
import recordRoutes from './routes/records.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', recordRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
