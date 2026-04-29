import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, timeAgo } from '../utils/api';

export default function Events() {
  const { user, apiFetch } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_date: '', venue: '', category: 'general', max_attendees: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const canCreate = ['admin', 'faculty'].includes(user?.role);

  const fetchEvents = async () => {
    const params = new URLSearchParams();
    if (filter === 'upcoming') params.set('upcoming', 'true');
    const res = await apiFetch(`/api/events?${params}`);
    setEvents(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [filter]);

  const handleRsvp = async (eventId, status, currentStatus) => {
    if (currentStatus === status) {
      await apiFetch(`/api/events/${eventId}/rsvp`, { method: 'DELETE' });
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, my_rsvp: null,
        going_count: status === 'going' ? e.going_count - 1 : e.going_count,
        interested_count: status === 'interested' ? e.interested_count - 1 : e.interested_count,
      } : e));
    } else {
      await apiFetch(`/api/events/${eventId}/rsvp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      setEvents(prev => prev.map(e => e.id === eventId ? {
        ...e, my_rsvp: status,
        going_count: status === 'going' ? e.going_count + 1 : (currentStatus === 'going' ? e.going_count - 1 : e.going_count),
        interested_count: status === 'interested' ? e.interested_count + 1 : (currentStatus === 'interested' ? e.interested_count - 1 : e.interested_count),
      } : e));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await apiFetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchEvents(); setShowModal(false);
      setForm({ title: '', description: '', event_date: '', venue: '', category: 'general', max_attendees: '' });
      showToast('Event created successfully');
    } catch (err) { showToast(err.message, 'error'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    await apiFetch(`/api/events/${id}`, { method: 'DELETE' });
    setEvents(prev => prev.filter(e => e.id !== id));
    showToast('Event deleted');
  };

  const categoryEmoji = { general: '🎪', technical: '💻', cultural: '🎭', sports: '⚽', academic: '📖' };

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">🎉 Events & Clubs</h1>
          <p className="page-subtitle">Discover and RSVP to campus events</p>
        </div>
        {canCreate && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Event</button>}
      </div>

      <div className="filters-bar">
        {['upcoming', 'all'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'upcoming' ? '📅 Upcoming' : '📋 All Events'}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="grid grid-2">
          {events.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state-icon">🎪</div>
              <h3>No events found</h3>
              <p>Check back later for upcoming events</p>
            </div>
          ) : events.map(ev => (
            <div key={ev.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Color header */}
              <div style={{ height: 8, background: `linear-gradient(90deg, #4f46e5, #06b6d4)` }} />
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.2rem' }}>{categoryEmoji[ev.category] || '🎪'}</span>
                      <span className="badge badge-primary">{ev.category}</span>
                      {ev.club_name && <span className="badge badge-cyan">{ev.club_name}</span>}
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--dark)', marginBottom: 6 }}>{ev.title}</h3>
                  </div>
                  {canCreate && (
                    <button className="btn-icon" onClick={() => handleDelete(ev.id)}>🗑️</button>
                  )}
                </div>

                {ev.description && (
                  <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: 14, lineHeight: 1.6 }}>{ev.description}</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                  <span>📅 {formatDateTime(ev.event_date)}</span>
                  {ev.venue && <span>📍 {ev.venue}</span>}
                  <span>👤 Organized by {ev.organizer_name}</span>
                  {ev.max_attendees && <span>🎟️ Max {ev.max_attendees} attendees</span>}
                </div>

                {/* RSVP counts */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: '12px', background: 'var(--gray-50)', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>✅ {ev.going_count} Going</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600 }}>⭐ {ev.interested_count} Interested</span>
                </div>

                {/* RSVP buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className={`btn btn-sm ${ev.my_rsvp === 'going' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => handleRsvp(ev.id, 'going', ev.my_rsvp)}
                  >
                    {ev.my_rsvp === 'going' ? '✅ Going' : '✓ Going'}
                  </button>
                  <button
                    className={`btn btn-sm ${ev.my_rsvp === 'interested' ? 'btn-secondary' : 'btn-outline'}`}
                    style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--warning)', color: ev.my_rsvp === 'interested' ? 'var(--warning)' : 'var(--warning)' }}
                    onClick={() => handleRsvp(ev.id, 'interested', ev.my_rsvp)}
                  >
                    {ev.my_rsvp === 'interested' ? '⭐ Interested' : '★ Interested'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create Event</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Event Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Annual Hackathon 2026" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Event details..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Date & Time *</label>
                    <input className="form-input" type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {['general','technical','cultural','sports','academic'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Venue</label>
                    <input className="form-input" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Auditorium / Room 101" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Attendees</label>
                    <input className="form-input" type="number" value={form.max_attendees} onChange={e => setForm(f => ({ ...f, max_attendees: e.target.value }))} placeholder="Leave blank for unlimited" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
