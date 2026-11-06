import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';

const EMPTY = { name: '', age: '', gender: 'male', phone: '', address: '', doctor: '' };

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api.get('/patients'), api.get('/doctors')])
      .then(([p, d]) => {
        setPatients(p.data);
        setDoctors(d.data);
      })
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const close = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (p) => {
    setForm({
      name: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      address: p.address || '',
      doctor: p.doctor?._id || '',
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const action = async (fn) => {
    setError('');
    try {
      await fn();
      await load();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const ok = await action(() =>
      editingId ? api.put(`/patients/${editingId}`, form) : api.post('/patients', form)
    );
    if (ok) close();
  };

  const remove = (p) => {
    if (window.confirm(`Remove patient ${p.name}?`)) action(() => api.delete(`/patients/${p._id}`));
  };

  const assign = (p, doctor) => action(() => api.put(`/patients/${p._id}`, { doctor }));

  const activeDoctors = doctors.filter((d) => d.active);

  return (
    <>
      <div className="head">
        <h2>Patients</h2>
        <button className="btn" onClick={() => (showForm ? close() : setShowForm(true))}>
          {showForm ? 'Cancel' : 'Register Patient'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {showForm && (
        <form className="card grid" onSubmit={submit}>
          <label>Name<input value={form.name} onChange={set('name')} required /></label>
          <label>Age<input type="number" min="0" max="130" value={form.age} onChange={set('age')} required /></label>
          <label>
            Gender
            <select value={form.gender} onChange={set('gender')}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Phone<input value={form.phone} onChange={set('phone')} required /></label>
          <label>Address<input value={form.address} onChange={set('address')} /></label>
          <label>
            Doctor
            <select value={form.doctor} onChange={set('doctor')}>
              <option value="">Unassigned</option>
              {activeDoctors.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>)}
            </select>
          </label>
          <div className="actions"><button className="btn">{editingId ? 'Update' : 'Save'}</button></div>
        </form>
      )}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Age</th><th>Gender</th><th>Phone</th><th>Doctor</th><th></th></tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p._id}>
                <td>{p.name}<small>{p.address}</small></td>
                <td>{p.age}</td>
                <td className="cap">{p.gender}</td>
                <td>{p.phone}</td>
                <td>
                  <select value={p.doctor?._id || ''} onChange={(e) => assign(p, e.target.value)}>
                    <option value="">Unassigned</option>
                    {doctors
                      .filter((d) => d.active || d._id === p.doctor?._id)
                      .map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </td>
                <td className="row-actions">
                  <button className="btn light" onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn danger" onClick={() => remove(p)}>Remove</button>
                </td>
              </tr>
            ))}
            {patients.length === 0 && <tr><td colSpan="6" className="muted">No patients yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
