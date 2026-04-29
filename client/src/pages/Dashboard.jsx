import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, categoryColors, timeAgo } from '../utils/api';

export default function Dashboard() {
  const { user, apiFetch } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/notices').then(r => r.json()),
      apiFetch('/api/events?upcoming=true').then(r => r.json()),
      apiFetch('/api/profile').then(r => r.json()),
    ]).then(([n, e, p]) => {
      setNotices((n || []).slice(0, 4));
      setEvents((e || []).slice(0, 4));
      setStats(p.stats);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const quickLinks = [
    { icon: '📢', label: 'Notice Board', to: '/notices', color: '#ef4444', bg: '#fee2e2' },
    { icon: '📚', label: 'Study Hub', to: '/study-hub', color: '#4f46e5', bg: '#e0e7ff' },
    { icon: '🗓️', label: 'Timetable', to: '/timetable', color: '#06b6d4', bg: '#cffafe' },
    { icon: '🎉', label: 'Events', to: '/events', color: '#10b981', bg: '#d1fae5' },
    { icon: '🏛️', label: 'Clubs', to: '/clubs', color: '#f59e0b', bg: '#fef3c7' },
    { icon: '💬', label: 'Discussions', to: '/discussions', color: '#8b5cf6', bg: '#ede9fe' },
  ];

  return (
    <div>
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
        borderRadius: 16, padding: '32px 36px', marginBottom: 28, color: 'white',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, fontSize: '8rem', opacity: 0.08 }}>🎓</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ opacity: 0.85, fontSize: '1rem' }}>
          {user?.branch && `${user.branch} • `}{user?.year && `Year ${user.year} • `}
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-row">
          {[
            { icon: '📤', value: stats.uploads, label: 'Uploads' },
            { icon: '💬', value: stats.discussions, label: 'Discussions' },
            { icon: '✅', value: stats.answers, label: 'Answers' },
            { icon: '🏛️', value: stats.clubs, label: 'Clubs Joined' },
            { icon: '🎉', value: stats.events_attended, label: 'Events RSVP' },
            { icon: '⭐', value: user?.contribution_score || 0, label: 'Score' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 28 }}>
        {quickLinks.map(({ icon, label, to, color, bg }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            style={{
              background: 'white', border: '1px solid var(--gray-200)',
              borderRadius: 12, padding: '20px 12px', cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.2s', boxShadow: 'var(--shadow)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto 10px' }}>{icon}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Two column: Notices + Events */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Notices */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>📢 Recent Notices</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/notices')}>View all</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {notices.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>No notices yet</div>
            ) : notices.map(n => (
              <div key={n.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {n.is_pinned && <span style={{ fontSize: '0.8rem' }}>📌</span>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge ${categoryColors[n.category] || 'badge-gray'}`}>{n.category}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{timeAgo(n.created_at)}</span>
                    {!n.seen && <span style={{ width: 6, height: 6, background: 'var(--primary)', borderRadius: '50%', display: 'inline-block' }} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>🎉 Upcoming Events</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')}>View all</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {events.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>No upcoming events</div>
            ) : events.map(ev => (
              <div key={ev.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{ev.title}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>📅 {formatDateTime(ev.event_date)}</span>
                  {ev.venue && <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>📍 {ev.venue}</span>}
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ {ev.going_count} going</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
