import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';
import Stat from '../components/Stat.jsx';

export default function SuperDashboard() {
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/stats/system').then((res) => setStats(res.data)).catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <>
      <h2>System Overview</h2>
      {error && <p className="error">{error}</p>}
      <div className="stats">
        <Stat label="Hospitals" value={stats.hospitals} />
        <Stat label="Active Hospitals" value={stats.activeHospitals} />
        <Stat label="Doctors" value={stats.doctors} />
        <Stat label="Patients" value={stats.patients} />
        <Stat label="Upcoming Appointments" value={stats.appointments} />
      </div>
    </>
  );
}
