import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY = { patient: '', date: '', reason: '' };

// Converts a stored date to the local format a datetime-local input expects.
const toLocalInput = (value) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const STATUS_TAG = { scheduled: 'info', completed: 'on', cancelled: 'off' };

export default function Appointments() {
  const { user } = useAuth();
  const isAdmin = user.role === 'hospital_admin';

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api.get('/appointments'), api.get(isAdmin ? '/patients' : '/patients/mine')])
      .then(([a, p]) => {
        setAppointments(a.data);
        setPatients(isAdmin ? p.data.filter((x) => x.doctor) : p.data);
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

  const startEdit = (a) => {
    setForm({ patient: a.patient?._id || '', date: toLocalInput(a.date), reason: a.reason });
    setEditingId(a._id);
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const date = new Date(form.date).toISOString();
    const ok = await action(() =>
      editingId
        ? api.put(`/appointments/${editingId}`, { date, reason: form.reason })
        : api.post('/appointments', { patient: form.patient, date, reason: form.reason })
    );
    if (ok) close();
  };

  const setStatus = (a, status) => action(() => api.put(`/appointments/${a._id}`, { status }));

  const cancel = (a) => {
    if (window.confirm(`Cancel this appointment for ${a.patient?.name}?`)) setStatus(a, 'cancelled');
  };

  const visible = appointments.filter((a) => filter === 'all' || a.status === filter);
  const columns = isAdmin ? 6 : 5;

  return (
    <>
      <div className="head">
        <h2>Appointments</h2>
        <button className="btn" onClick={() => (showForm ? close() : setShowForm(true))}>
          {showForm ? 'Cancel' : 'Book Appointment'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {showForm && (
        <form className="card grid" onSubmit={submit}>
          <label>
            Patient
            <select value={form.patient} onChange={set('patient')} required disabled={Boolean(editingId)}>
              <option value="">Select a patient</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}{isAdmin ? ` (Dr. ${p.doctor.name})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date and time (15 minute slots)
            <input type="datetime-local" step="900" value={form.date} onChange={set('date')} required />
          </label>
          <label>Reason<input value={form.reason} onChange={set('reason')} required /></label>
          <div className="actions"><button className="btn">{editingId ? 'Update' : 'Book'}</button></div>
        </form>
      )}

      <div className="filter">
        <label>
          Show
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Patient</th>{isAdmin && <th>Doctor</th>}<th>Reason</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a._id}>
                <td>{new Date(a.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                <td>{a.patient?.name}<small>{a.patient?.phone}</small></td>
                {isAdmin && <td>{a.doctor?.name || 'Removed doctor'}</td>}
                <td>{a.reason}</td>
                <td><span className={`tag cap ${STATUS_TAG[a.status]}`}>{a.status}</span></td>
                <td className="row-actions">
                  {a.status === 'scheduled' && (
                    <>
                      <button className="btn light" onClick={() => startEdit(a)}>Reschedule</button>
                      <button className="btn light" onClick={() => setStatus(a, 'completed')}>Complete</button>
                      <button className="btn danger" onClick={() => cancel(a)}>Cancel</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={columns} className="muted">No appointments to show.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
