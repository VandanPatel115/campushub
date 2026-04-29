import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = {
  Technical: { bg: '#e0e7ff', color: '#4338ca' },
  Sports: { bg: '#d1fae5', color: '#065f46' },
  Arts: { bg: '#fce7f3', color: '#9d174d' },
  Academic: { bg: '#fef3c7', color: '#92400e' },
  Cultural: { bg: '#cffafe', color: '#155e75' },
};

export default function Clubs() {
  const { user, apiFetch } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'Technical' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    apiFetch('/api/clubs').then(r => r.json()).then(data => { setClubs(data); setLoading(false); });
  }, []);

  const handleJoinLeave = async (clubId, isMember) => {
    if (isMember) {
      await apiFetch(`/api/clubs/${clubId}/leave`, { method: 'DELETE' });
      setClubs(prev => prev.map(c => c.id === clubId ? { ...c, is_member: false, member_count: parseInt(c.member_count) - 1 } : c));
      showToast('Left club');
    } else {
      await apiFetch(`/api/clubs/${clubId}/join`, { method: 'POST' });
      setClubs(prev => prev.map(c => c.id === clubId ? { ...c, is_member: true, member_count: parseInt(c.member_count) + 1 } : c));
      showToast('Joined club! +2 points');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await apiFetch('/api/clubs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error);
      const newClub = await res.json();
      setClubs(prev => [newClub, ...prev]);
      setShowModal(false);
      setForm({ name: '', description: '', category: 'Technical' });
      showToast('Club created successfully');
    } catch (err) { showToast(err.message, 'error'); }
    setSubmitting(false);
  };

  const clubEmojis = ['🖥️', '⚽', '📷', '🎤', '📚', '🎨', '🔬', '🎸', '♟️', '🚀'];

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">🏛️ Clubs & Societies</h1>
          <p className="page-subtitle">Join communities that match your interests</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Club</button>
        )}
      </div>

      <div style={{ marginBottom: 20, padding: '16px 20px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 12, border: '1px solid #bbf7d0', fontSize: '0.875rem', color: '#166534' }}>
        🎯 Join clubs to earn contribution points and unlock badges!
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="grid grid-3">
          {clubs.map((club, idx) => {
            const catStyle = CATEGORY_COLORS[club.category] || { bg: '#f1f5f9', color: '#475569' };
            return (
              <div key={club.id} className="card" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ padding: '24px' }}>
                  {/* Club icon */}
                  <div style={{ width: 60, height: 60, borderRadius: 14, background: catStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 16 }}>
                    {clubEmojis[idx % clubEmojis.length]}
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: catStyle.bg, color: catStyle.color, fontSize: '0.75rem', fontWeight: 600 }}>{club.category}</span>
                  </div>

                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8, color: 'var(--dark)' }}>{club.name}</h3>
                  {club.description && (
                    <p style={{ color: 'var(--gray-600)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: 16 }}>{club.description}</p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                      👥 <strong>{club.member_count}</strong> members
                    </div>
                    {club.president_name && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        👑 {club.president_name}
                      </div>
                    )}
                  </div>

                  <button
                    className={`btn btn-sm ${club.is_member ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleJoinLeave(club.id, club.is_member)}
                  >
                    {club.is_member ? '✓ Joined' : '+ Join Club'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create New Club</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Club Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Robotics Club" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this club about?" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Club'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
