import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 11 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`);
const COLORS = ['#4f46e5','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#0891b2'];

export default function Timetable() {
  const { apiFetch } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', subject: '', room: '', instructor: '', color: '#4f46e5' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    apiFetch('/api/timetable').then(r => r.json()).then(data => { setSlots(data); setLoading(false); });
  }, []);

  const openAdd = (day = 'Monday') => {
    setEditing(null);
    setForm({ day_of_week: day, start_time: '09:00', end_time: '10:00', subject: '', room: '', instructor: '', color: '#4f46e5' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (slot) => {
    setEditing(slot.id);
    setForm({ day_of_week: slot.day_of_week, start_time: slot.start_time.slice(0,5), end_time: slot.end_time.slice(0,5), subject: slot.subject, room: slot.room || '', instructor: slot.instructor || '', color: slot.color || '#4f46e5' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const url = editing ? `/api/timetable/${editing}` : '/api/timetable';
      const method = editing ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const updated = await res.json();
      if (editing) setSlots(prev => prev.map(s => s.id === editing ? updated : s));
      else setSlots(prev => [...prev, updated]);
      setShowModal(false);
      showToast(editing ? 'Class updated' : 'Class added');
    } catch (err) { setError(err.message); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    await apiFetch(`/api/timetable/${id}`, { method: 'DELETE' });
    setSlots(prev => prev.filter(s => s.id !== id));
    showToast('Class removed');
  };

  const getSlotForCell = (day, hour) => {
    return slots.filter(s => {
      if (s.day_of_week !== day) return false;
      const start = s.start_time.slice(0,5);
      const end = s.end_time.slice(0,5);
      return start <= hour && hour < end;
    });
  };

  const isStartOfSlot = (slot, hour) => slot.start_time.slice(0,5) === hour;

  const calcSpan = (slot) => {
    const [sh, sm] = slot.start_time.split(':').map(Number);
    const [eh, em] = slot.end_time.split(':').map(Number);
    return Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60);
  };

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">🗓️ My Timetable</h1>
          <p className="page-subtitle">Manage your weekly schedule</p>
        </div>
        <button className="btn btn-primary" onClick={() => openAdd()}>+ Add Class</button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', background: 'var(--gray-50)', borderBottom: '2px solid var(--gray-200)', width: 70, fontSize: '0.8rem', color: 'var(--gray-600)' }}>Time</th>
                  {DAYS.map(day => (
                    <th key={day} style={{ padding: '12px', background: 'var(--gray-50)', borderBottom: '2px solid var(--gray-200)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                      <div>{day.slice(0,3)}</div>
                      <button style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2, fontWeight: 500 }} onClick={() => openAdd(day)}>+ Add</button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map(hour => {
                  const rendered = new Set();
                  return (
                    <tr key={hour}>
                      <td style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-100)', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{hour}</td>
                      {DAYS.map(day => {
                        const daySlots = getSlotForCell(day, hour);
                        const startingSlots = daySlots.filter(s => isStartOfSlot(s, hour));

                        if (daySlots.length > 0 && !startingSlots.length) {
                          if (rendered.has(`${day}-${daySlots[0].id}`)) return null;
                          return null;
                        }

                        return (
                          <td key={day} style={{ padding: '4px', borderBottom: '1px solid var(--gray-100)', verticalAlign: 'top', minHeight: 50 }}>
                            {startingSlots.map(slot => {
                              rendered.add(`${day}-${slot.id}`);
                              const span = calcSpan(slot);
                              return (
                                <div
                                  key={slot.id}
                                  style={{
                                    background: slot.color || '#4f46e5',
                                    color: 'white',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    minHeight: span * 48,
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    lineHeight: 1.4,
                                    position: 'relative',
                                  }}
                                  onClick={() => openEdit(slot)}
                                >
                                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{slot.subject}</div>
                                  {slot.room && <div style={{ opacity: 0.85 }}>📍 {slot.room}</div>}
                                  {slot.instructor && <div style={{ opacity: 0.85 }}>👨‍🏫 {slot.instructor}</div>}
                                  <div style={{ opacity: 0.75, marginTop: 2 }}>{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</div>
                                  <button
                                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 4, color: 'white', cursor: 'pointer', padding: '2px 6px', fontSize: '0.7rem' }}
                                    onClick={e => { e.stopPropagation(); handleDelete(slot.id); }}
                                  >✕</button>
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {slots.length === 0 && (
            <div className="empty-state" style={{ padding: '60px' }}>
              <div className="empty-state-icon">🗓️</div>
              <h3>No classes yet</h3>
              <p>Click "+ Add Class" to start building your timetable</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Class' : 'Add Class'}</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input className="form-input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Data Structures" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Day *</label>
                    <select className="form-select" value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8 }}>
                      {COLORS.map(c => (
                        <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                          style={{ width: 24, height: 24, borderRadius: 6, background: c, cursor: 'pointer', border: form.color === c ? '3px solid #1e293b' : '3px solid transparent' }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input className="form-input" type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time *</label>
                    <input className="form-input" type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Room</label>
                    <input className="form-input" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="e.g. Lab 302" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Instructor</label>
                    <input className="form-input" value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} placeholder="Prof. Name" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : (editing ? 'Update' : 'Add Class')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
