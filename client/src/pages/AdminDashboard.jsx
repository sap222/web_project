import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';
import Stat from '../components/Stat.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/stats/hospital'), api.get('/hospitals/mine')])
      .then(([s, h]) => {
        setStats(s.data);
        const { name, address, phone, email } = h.data;
        setForm({ name, address, phone, email: email || '' });
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const set = (key) => (e) => {
    setSaved(false);
    setForm({ ...form, [key]: e.target.value });
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put('/hospitals/mine', form);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <h2>{form.name || 'Hospital'}</h2>
      {error && <p className="error">{error}</p>}
      <div className="stats">
        <Stat label="Doctors" value={stats.doctors} />
        <Stat label="Patients" value={stats.patients} />
        <Stat label="Unassigned Patients" value={stats.unassigned} />
      </div>

      <h3>Hospital Information</h3>
      <form className="card grid" onSubmit={save}>
        <label>Name<input value={form.name} onChange={set('name')} required /></label>
        <label>Address<input value={form.address} onChange={set('address')} required /></label>
        <label>Phone<input value={form.phone} onChange={set('phone')} required /></label>
        <label>Email<input type="email" value={form.email} onChange={set('email')} /></label>
        <div className="actions">
          <button className="btn">Save</button>
          {saved && <span className="ok">Saved</span>}
        </div>
      </form>
    </>
  );
}
