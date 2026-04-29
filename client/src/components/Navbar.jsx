import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header style={{
      height: 'var(--navbar-height)',
      background: 'white',
      borderBottom: '1px solid var(--gray-200)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
        Welcome back, <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{user?.name?.split(' ')[0]}</span> 👋
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <div className="avatar avatar-sm" style={{ background: 'var(--primary)', color: 'white' }}>
            {user?.name?.charAt(0)}
          </div>
          Profile
        </button>

        <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/login'); }}>
          Sign Out
        </button>
      </div>
    </header>
  );
}
