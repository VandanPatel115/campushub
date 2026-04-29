import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: '🏠', label: 'Dashboard', end: true },
  { to: '/notices', icon: '📢', label: 'Notice Board' },
  { to: '/study-hub', icon: '📚', label: 'Study Hub' },
  { to: '/timetable', icon: '🗓️', label: 'Timetable' },
  { to: '/events', icon: '🎉', label: 'Events' },
  { to: '/clubs', icon: '🏛️', label: 'Clubs' },
  { to: '/discussions', icon: '💬', label: 'Discussions' },
  { to: '/profile', icon: '🧑‍🎓', label: 'My Profile' },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--dark)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
      boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', flexShrink: 0,
          }}>🎓</div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.3px' }}>CampusHub</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 500 }}>ONE PLATFORM</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, icon, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8, marginBottom: 4,
              color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
              background: isActive ? 'rgba(79,70,229,0.6)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              textDecoration: 'none',
            })}
          >
            <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div className="avatar" style={{ background: '#4f46e5', color: 'white', fontSize: '0.85rem' }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', textTransform: 'capitalize' }}>{user?.role}</div>
        </div>
      </div>
    </aside>
  );
}
