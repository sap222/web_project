import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';

const EMPTY = { name: '', address: '', phone: '', email: '', adminName: '', adminEmail: '', adminPassword: '' };

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    api.get('/hospitals').then((res) => setHospitals(res.data)).catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const run = async (action) => {
    setError('');
    try {
      await action();
      await load();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    }
  };

  const create = async (e) => {
    e.preventDefault();
    const { adminName, adminEmail, adminPassword, ...hospital } = form;
    const ok = await run(() =>
      api.post('/hospitals', { ...hospital, admin: { name: adminName, email: adminEmail, password: adminPassword } })
    );
    if (ok) {
      setForm(EMPTY);
      setShowForm(false);
    }
  };

  const toggle = (h) => run(() => api.put(`/hospitals/${h._id}`, { active: !h.active }));

  const remove = (h) => {
    if (window.confirm(`Delete ${h.name} with all its doctors and patients?`)) {
      run(() => api.delete(`/hospitals/${h._id}`));
    }
  };

  return (
    <>
      <div className="head">
        <h2>Hospitals</h2>
        <button className="btn" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Hospital'}</button>
      </div>
      {error && <p className="error">{error}</p>}

      {showForm && (
        <form className="card grid" onSubmit={create}>
          <label>Hospital name<input value={form.name} onChange={set('name')} required /></label>
          <label>Address<input value={form.address} onChange={set('address')} required /></label>
          <label>Phone<input value={form.phone} onChange={set('phone')} required /></label>
          <label>Hospital email<input type="email" value={form.email} onChange={set('email')} /></label>
          <label>Admin name<input value={form.adminName} onChange={set('adminName')} required /></label>
          <label>Admin email<input type="email" value={form.adminEmail} onChange={set('adminEmail')} required /></label>
          <label>Admin password<input type="password" minLength={6} value={form.adminPassword} onChange={set('adminPassword')} required /></label>
          <div className="actions"><button className="btn">Save</button></div>
        </form>
      )}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Admin</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {hospitals.map((h) => (
              <tr key={h._id}>
                <td>{h.name}<small>{h.address}</small></td>
                <td>{h.phone}</td>
                <td>{h.admin ? <>{h.admin.name}<small>{h.admin.email}</small></> : '-'}</td>
                <td><span className={`tag ${h.active ? 'on' : 'off'}`}>{h.active ? 'Active' : 'Inactive'}</span></td>
                <td className="row-actions">
                  <button className="btn light" onClick={() => toggle(h)}>{h.active ? 'Deactivate' : 'Activate'}</button>
                  <button className="btn danger" onClick={() => remove(h)}>Delete</button>
                </td>
              </tr>
            ))}
            {hospitals.length === 0 && <tr><td colSpan="5" className="muted">No hospitals yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
