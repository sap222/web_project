import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';

const EMPTY = { name: '', email: '', password: '', specialization: '', phone: '' };

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    api.get('/doctors').then((res) => setDoctors(res.data)).catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const close = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (d) => {
    setForm({ name: d.name, email: d.email, password: '', specialization: d.specialization || '', phone: d.phone || '' });
    setEditingId(d._id);
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await api.put(`/doctors/${editingId}`, form);
      else await api.post('/doctors', form);
      close();
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const action = async (fn) => {
    setError('');
    try {
      await fn();
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = (d) => {
    if (window.confirm(`Remove Dr. ${d.name}? Their patients become unassigned.`)) {
      action(() => api.delete(`/doctors/${d._id}`));
    }
  };

  return (
    <>
      <div className="head">
        <h2>Doctors</h2>
        <button className="btn" onClick={() => (showForm ? close() : setShowForm(true))}>
          {showForm ? 'Cancel' : 'Add Doctor'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {showForm && (
        <form className="card grid" onSubmit={submit}>
          <label>Name<input value={form.name} onChange={set('name')} required /></label>
          <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
          <label>
            {editingId ? 'New password (optional)' : 'Password'}
            <input type="password" minLength={6} value={form.password} onChange={set('password')} required={!editingId} />
          </label>
          <label>Specialization<input value={form.specialization} onChange={set('specialization')} required /></label>
          <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
          <div className="actions"><button className="btn">{editingId ? 'Update' : 'Save'}</button></div>
        </form>
      )}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Specialization</th><th>Phone</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d._id}>
                <td>{d.name}<small>{d.email}</small></td>
                <td>{d.specialization}</td>
                <td>{d.phone || '-'}</td>
                <td><span className={`tag ${d.active ? 'on' : 'off'}`}>{d.active ? 'Active' : 'Inactive'}</span></td>
                <td className="row-actions">
                  <button className="btn light" onClick={() => startEdit(d)}>Edit</button>
                  <button className="btn light" onClick={() => action(() => api.put(`/doctors/${d._id}`, { active: !d.active }))}>
                    {d.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn danger" onClick={() => remove(d)}>Remove</button>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && <tr><td colSpan="5" className="muted">No doctors yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
