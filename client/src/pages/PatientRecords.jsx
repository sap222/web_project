import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const emptyForm = () => ({ visitDate: today(), diagnosis: '', symptoms: '', prescription: '', notes: '' });

// Visit dates are stored as a calendar date at midnight UTC.
const showDate = (value) => new Date(value).toLocaleDateString([], { dateStyle: 'medium', timeZone: 'UTC' });

export default function PatientRecords() {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    api
      .get(`/records/patient/${id}`)
      .then((res) => {
        setPatient(res.data.patient);
        setRecords(res.data.records);
      })
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    load();
  }, [id]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const close = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (r) => {
    setForm({
      visitDate: r.visitDate.slice(0, 10),
      diagnosis: r.diagnosis,
      symptoms: r.symptoms || '',
      prescription: r.prescription || '',
      notes: r.notes || '',
    });
    setEditingId(r._id);
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
      editingId ? api.put(`/records/${editingId}`, form) : api.post(`/records/patient/${id}`, form)
    );
    if (ok) close();
  };

  const remove = (r) => {
    if (window.confirm('Delete this medical record?')) action(() => api.delete(`/records/${r._id}`));
  };

  return (
    <>
      <Link className="back" to="/doctor">Back to My Patients</Link>
      <div className="head">
        <h2>{patient ? patient.name : 'Patient'}</h2>
        {patient && (
          <button className="btn" onClick={() => (showForm ? close() : setShowForm(true))}>
            {showForm ? 'Cancel' : 'Add Record'}
          </button>
        )}
      </div>
      {error && <p className="error">{error}</p>}

      {patient && (
        <p className="muted cap">
          {patient.age} years, {patient.gender}, {patient.phone}
        </p>
      )}

      {showForm && (
        <form className="card grid" onSubmit={submit}>
          <label>Visit date<input type="date" max={today()} value={form.visitDate} onChange={set('visitDate')} required /></label>
          <label>Diagnosis<input value={form.diagnosis} onChange={set('diagnosis')} required /></label>
          <label>Symptoms<input value={form.symptoms} onChange={set('symptoms')} /></label>
          <label>Prescription<input value={form.prescription} onChange={set('prescription')} /></label>
          <label className="wide">Notes<textarea rows="3" value={form.notes} onChange={set('notes')} /></label>
          <div className="actions"><button className="btn">{editingId ? 'Update' : 'Save'}</button></div>
        </form>
      )}

      <h3>Medical Records</h3>
      {patient && records.length === 0 && <p className="muted">No records yet.</p>}
      {records.map((r) => (
        <article className="card record" key={r._id}>
          <div className="head">
            <div>
              <strong>{r.diagnosis}</strong>
              <small>{showDate(r.visitDate)} by {r.doctor ? `Dr. ${r.doctor.name}` : 'a former doctor'}</small>
            </div>
            {r.doctor?._id === user.id && (
              <div className="row-actions">
                <button className="btn light" onClick={() => startEdit(r)}>Edit</button>
                <button className="btn danger" onClick={() => remove(r)}>Delete</button>
              </div>
            )}
          </div>
          {r.symptoms && <p><b>Symptoms:</b> {r.symptoms}</p>}
          {r.prescription && <p><b>Prescription:</b> {r.prescription}</p>}
          {r.notes && <p><b>Notes:</b> {r.notes}</p>}
        </article>
      ))}
    </>
  );
}
