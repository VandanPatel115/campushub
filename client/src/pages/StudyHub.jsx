import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { timeAgo, formatDate } from '../utils/api';

const SEMESTERS = [1,2,3,4,5,6,7,8];
const FILE_ICONS = { 'application/pdf': '📄', 'application/vnd.ms-powerpoint': '📊', 'application/msword': '📝', default: '📁' };

export default function StudyHub() {
  const { apiFetch } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [form, setForm] = useState({ title: '', description: '', subject: '', semester: '', branch: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchMaterials = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (semFilter) params.set('semester', semFilter);
    if (sortBy) params.set('sort', sortBy);
    const res = await apiFetch(`/api/study-hub?${params}`);
    setMaterials(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, [search, semFilter, sortBy]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return showToast('Please select a file', 'error');
    setSubmitting(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
    data.append('file', file);
    try {
      const res = await apiFetch('/api/study-hub', { method: 'POST', body: data });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchMaterials();
      setShowModal(false);
      setForm({ title: '', description: '', subject: '', semester: '', branch: '' });
      setFile(null);
      showToast('Material uploaded successfully! +5 points');
    } catch (err) { showToast(err.message, 'error'); }
    setSubmitting(false);
  };

  const handleLike = async (id) => {
    const res = await apiFetch(`/api/study-hub/${id}/like`, { method: 'POST' });
    const data = await res.json();
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, liked: data.liked, like_count: m.like_count + (data.liked ? 1 : -1) } : m));
  };

  const handleDownload = async (id, title) => {
    const res = await apiFetch(`/api/study-hub/${id}/download`);
    const data = await res.json();
    window.open(data.url, '_blank');
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, download_count: m.download_count + 1 } : m));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this material?')) return;
    await apiFetch(`/api/study-hub/${id}`, { method: 'DELETE' });
    setMaterials(prev => prev.filter(m => m.id !== id));
    showToast('Material deleted');
  };

  const getFileIcon = (type) => FILE_ICONS[type] || FILE_ICONS.default;
  const formatSize = (bytes) => bytes ? `${(bytes / (1024*1024)).toFixed(1)} MB` : '';

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Study Hub</h1>
          <p className="page-subtitle">Share and discover study materials</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Upload Material</button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search by subject or title..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={semFilter} onChange={e => setSemFilter(e.target.value)}>
          <option value="">All Semesters</option>
          {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="recent">Recently Added</option>
          <option value="popular">Most Liked</option>
          <option value="downloaded">Most Downloaded</option>
        </select>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="grid grid-3">
          {materials.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state-icon">📂</div>
              <h3>No materials found</h3>
              <p>Be the first to upload study materials!</p>
            </div>
          ) : materials.map(m => (
            <div key={m.id} className="card" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ padding: '20px' }}>
                {/* File type icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: '2rem' }}>{getFileIcon(m.file_type)}</div>
                    <div>
                      {m.semester && <span className="badge badge-primary" style={{ marginBottom: 4 }}>Sem {m.semester}</span>}
                      {m.branch && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{m.branch}</div>}
                    </div>
                  </div>
                  <button className="btn-icon" onClick={() => handleDelete(m.id)} title="Delete">🗑️</button>
                </div>

                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6, color: 'var(--dark)' }}>{m.title}</h3>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.8rem', marginBottom: 8 }}>{m.subject}</p>
                {m.description && <p style={{ color: 'var(--gray-500)', fontSize: '0.78rem', marginBottom: 12, lineHeight: 1.5 }}>{m.description}</p>}

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  <span>By {m.uploader_name}</span>
                  <span>·</span>
                  <span>{timeAgo(m.created_at)}</span>
                  {m.file_size && <span>· {formatSize(m.file_size)}</span>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.liked ? 'var(--danger)' : 'var(--gray-500)', fontWeight: 500 }} onClick={() => handleLike(m.id)}>
                      {m.liked ? '❤️' : '🤍'} {m.like_count}
                    </button>
                    <span>⬇️ {m.download_count}</span>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleDownload(m.id, m.title)}>Download</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Upload Study Material</span>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Data Structures Notes Unit 3" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <input className="form-input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Data Structures" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select className="form-select" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                      <option value="">Select semester</option>
                      {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Branch (optional)</label>
                  <input className="form-input" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} placeholder="e.g. Computer Science" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the material..." style={{ minHeight: 80 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">File * (max 20MB)</label>
                  <input type="file" onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip" required style={{ fontSize: '0.875rem', padding: '8px 0' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
