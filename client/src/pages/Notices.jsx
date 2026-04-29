import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { timeAgo, categoryColors } from '../utils/api';

const CATEGORIES = ['all', 'exam', 'event', 'internship', 'urgent', 'general'];

export default function Notices() {
  const { user, apiFetch } = useAuth();
  const [notices, setNotices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', department: '', is_pinned: false });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchNotices = async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('category', filter);
    if (search) params.set('search', search);
    const res = await apiFetch(`/api/notices?${params}`);
    setNotices(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchNotices(); }, [filter, search]);

  const markSeen = async (id) => {
    await apiFetch(`/api/notices/${id}/seen`, { method: 'PATCH' });
    setNotices(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n));
  };

  const handlePost = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await apiFetch('/api/notices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchNotices(); setShowModal(false);
      setForm({ title: '', content: '', category: 'general', department: '', is_pinned: false });
      showToast('Notice posted successfully');
    } catch (err) { showToast(err.message, 'error'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this notice?')) return;
    await apiFetch(`/api/notices/${id}`, { method: 'DELETE' });
    setNotices(prev => prev.filter(n => n.id !== id));
    showToast('Notice deleted');
  };

  const handlePin = async (id) => {
    const res = await apiFetch(`/api/notices/${id}/pin`, { method: 'PATCH' });
    const updated = await res.json();
    setNotices(prev => prev.map(n => n.id === id ? { ...n, is_pinned: updated.is_pinned } : n));
  };

  const unseen = notices.filter(n => !n.seen).length;
  const canPost = ['admin', 'faculty'].includes(user?.role);

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">📢 Notice Board</h1>
          <p className="page-subtitle">Stay updated with all campus announcements</p>
        </div>
        {canPost && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Post Notice</button>
        )}
      </div>

      {unseen > 0 && (
        <div style={{ background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 10, padding: '12px 18px', marginBottom: 20, color: '#5b21b6', fontSize: '0.875rem', fontWeight: 500 }}>
          📬 You have {unseen} unread notice{unseen > 1 ? 's' : ''}
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {CATEGORIES.map(c => (
          <button key={c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notices.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📭</div><h3>No notices found</h3><p>Try adjusting your filters</p></div>
          ) : notices.map(n => (
            <div
              key={n.id}
              className="card"
              style={{ borderLeft: `4px solid ${n.is_pinned ? '#f59e0b' : n.category === 'urgent' ? '#ef4444' : '#4f46e5'}`, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onClick={() => markSeen(n.id)}
            >
              <div style={{ padding: '18px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {n.is_pinned && <span className="badge badge-warning">📌 Pinned</span>}
                    <span className={`badge ${categoryColors[n.category] || 'badge-gray'}`}>{n.category}</span>
                    {!n.seen && <span className="badge badge-primary">New</span>}
                    {n.department && <span className="badge badge-gray">{n.department}</span>}
                  </div>
                  {canPost && (
                    <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <button className="btn-icon" title="Pin" onClick={() => handlePin(n.id)}>📌</button>
                      <button className="btn-icon" title="Delete" onClick={() => handleDelete(n.id)}>🗑️</button>
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--dark)' }}>{n.title}</h3>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', lineHeight: 1.6 }}>{n.content}</p>
                <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  <span>By {n.author_name || 'Admin'}</span>
                  <span>{timeAgo(n.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Post New Notice</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePost}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notice title" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Content *</label>
                  <textarea className="form-textarea" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Notice details..." required style={{ minHeight: 120 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {['exam', 'event', 'internship', 'urgent', 'general'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department (optional)</label>
                    <input className="form-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Computer Science" />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>📌 Pin this notice</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Posting...' : 'Post Notice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
