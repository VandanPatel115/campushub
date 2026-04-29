import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/api';

export default function Discussions() {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchDiscussions = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    const res = await apiFetch(`/api/discussions?${params}`);
    setDiscussions(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchDiscussions(); }, [search, sort]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await apiFetch('/api/discussions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchDiscussions();
      setShowModal(false);
      setForm({ title: '', content: '', tags: [] });
      showToast('Discussion posted! +3 points');
    } catch (err) { showToast(err.message, 'error'); }
    setSubmitting(false);
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">💬 Discussions</h1>
          <p className="page-subtitle">Ask questions, share knowledge, help others</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Ask Question</button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search discussions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[['recent', '🕐 Recent'], ['votes', '👍 Most Voted'], ['answers', '💬 Most Answered']].map(([v, l]) => (
          <button key={v} className={`filter-chip ${sort === v ? 'active' : ''}`} onClick={() => setSort(v)}>{l}</button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {discussions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💭</div>
              <h3>No discussions yet</h3>
              <p>Be the first to ask a question!</p>
            </div>
          ) : discussions.map(d => (
            <div
              key={d.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onClick={() => navigate(`/discussions/${d.id}`)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
            >
              <div style={{ padding: '18px 24px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                {/* Vote count column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 60 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: d.vote_count > 0 ? 'var(--success)' : d.vote_count < 0 ? 'var(--danger)' : 'var(--gray-700)' }}>{d.vote_count}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>votes</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: d.is_solved ? 'var(--success)' : 'var(--gray-700)' }}>{d.answer_count}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>answers</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-600)' }}>{d.view_count}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>views</div>
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    {d.is_solved && <span className="badge badge-success">✓ Solved</span>}
                    {(d.tags || []).map(tag => (
                      <span key={tag} className="badge badge-primary">{tag}</span>
                    ))}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--dark)', marginBottom: 8, lineHeight: 1.4 }}>{d.title}</h3>
                  <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {d.content}
                  </p>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                    <div className="avatar avatar-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{d.author_name?.charAt(0)}</div>
                    <span style={{ color: 'var(--gray-700)', fontWeight: 500 }}>{d.author_name}</span>
                    {d.author_branch && <span>{d.author_branch}</span>}
                    <span>·</span>
                    <span>{timeAgo(d.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Ask a Question</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Question Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. How to implement binary search tree in C++?" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Details *</label>
                  <textarea className="form-textarea" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Provide more context, what you've tried, what you're confused about..." style={{ minHeight: 140 }} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (press Enter to add)</label>
                  <div className="tag-input-container" style={{ border: '1.5px solid var(--gray-300)', borderRadius: 8, padding: '8px 12px', minHeight: 44, background: 'white' }}>
                    {form.tags.map(tag => (
                      <span key={tag} className="tag">
                        {tag} <span className="tag-remove" onClick={() => removeTag(tag)}>✕</span>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={addTag}
                      placeholder={form.tags.length === 0 ? "e.g. java, algorithms, dbms" : ""}
                      style={{ border: 'none', outline: 'none', flex: 1, minWidth: 100, fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Posting...' : 'Post Question'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
