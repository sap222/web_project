import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import SuperDashboard from './pages/SuperDashboard.jsx';
import Hospitals from './pages/Hospitals.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Doctors from './pages/Doctors.jsx';
import Patients from './pages/Patients.jsx';
import MyPatients from './pages/MyPatients.jsx';
import PatientRecords from './pages/PatientRecords.jsx';
import Appointments from './pages/Appointments.jsx';

export const HOME = {
  super_admin: '/super',
  hospital_admin: '/admin',
  doctor: '/doctor',
};

function Guard({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={HOME[user.role]} replace />;
  return <Layout>{children}</Layout>;
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading...</p>;
  return <Navigate to={user ? HOME[user.role] : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/super" element={<Guard role="super_admin"><SuperDashboard /></Guard>} />
      <Route path="/super/hospitals" element={<Guard role="super_admin"><Hospitals /></Guard>} />
      <Route path="/admin" element={<Guard role="hospital_admin"><AdminDashboard /></Guard>} />
      <Route path="/admin/doctors" element={<Guard role="hospital_admin"><Doctors /></Guard>} />
      <Route path="/admin/patients" element={<Guard role="hospital_admin"><Patients /></Guard>} />
      <Route path="/admin/appointments" element={<Guard role="hospital_admin"><Appointments /></Guard>} />
      <Route path="/doctor" element={<Guard role="doctor"><MyPatients /></Guard>} />
      <Route path="/doctor/patients/:id" element={<Guard role="doctor"><PatientRecords /></Guard>} />
      <Route path="/doctor/appointments" element={<Guard role="doctor"><Appointments /></Guard>} />
      <Route path="*" element={<Root />} />
    </Routes>
  );
}
