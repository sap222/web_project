import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client.js';
import Stat from '../components/Stat.jsx';

export default function MyPatients() {
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/patients/mine'), api.get('/stats/doctor')])
      .then(([p, s]) => {
        setPatients(p.data);
        setStats(s.data);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <>
      <h2>Doctor Dashboard</h2>
      {error && <p className="error">{error}</p>}
      <div className="stats">
        <Stat label="My Patients" value={stats.patients} />
        <Stat label="Upcoming Appointments" value={stats.appointments} />
        <Stat label="Records Written" value={stats.records} />
      </div>

      <h3>My Patients</h3>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Age</th><th>Gender</th><th>Phone</th><th>Address</th><th></th></tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.age}</td>
                <td className="cap">{p.gender}</td>
                <td>{p.phone}</td>
                <td>{p.address || '-'}</td>
                <td className="row-actions">
                  <Link className="btn light" to={`/doctor/patients/${p._id}`}>Records</Link>
                </td>
              </tr>
            ))}
            {patients.length === 0 && <tr><td colSpan="6" className="muted">No patients assigned yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
