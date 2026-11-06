import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';

export default function MyPatients() {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/patients/mine').then((res) => setPatients(res.data)).catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <>
      <h2>My Patients</h2>
      {error && <p className="error">{error}</p>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Age</th><th>Gender</th><th>Phone</th><th>Address</th></tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.age}</td>
                <td className="cap">{p.gender}</td>
                <td>{p.phone}</td>
                <td>{p.address || '-'}</td>
              </tr>
            ))}
            {patients.length === 0 && <tr><td colSpan="5" className="muted">No patients assigned yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
