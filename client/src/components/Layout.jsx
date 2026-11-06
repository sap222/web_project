import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = {
  super_admin: [
    { to: '/super', label: 'Dashboard', end: true },
    { to: '/super/hospitals', label: 'Hospitals' },
  ],
  hospital_admin: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/doctors', label: 'Doctors' },
    { to: '/admin/patients', label: 'Patients' },
  ],
  doctor: [{ to: '/doctor', label: 'My Patients', end: true }],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>HMS</h1>
        <nav>
          {LINKS[user.role].map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="who">
          <strong>{user.name}</strong>
          <span>{user.role.replace('_', ' ')}</span>
          <button className="btn light" onClick={handleLogout}>Log out</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
