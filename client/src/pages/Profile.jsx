import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/api';

export default function Profile() {
  const { user, apiFetch } = useAuth();
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [skillInput, setSkillInput] = useState('');
  const [tab, setTab] = useState('profile');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    Promise.all([
      apiFetch('/api/profile').then(r => r.json()),
      apiFetch('/api/profile/leaderboard').then(r => r.json()),
    ]).then(([p, l]) => {
      setProfile(p);
      setForm({ name: p.name, branch: p.branch || '', year: p.year || '', skills: p.skills || [], bio: p.bio || '' });
      setLeaderboard(l);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await apiFetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const updated = await res.json();
      setProfile(p => ({ ...p, ...updated }));
      setEditing(false);
      showToast('Profile updated successfully');
    } catch { showToast('Failed to update profile', 'error'); }
    setSubmitting(false);
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      setForm(f => ({ ...f, skills: [...(f.skills || []), skillInput.trim()] }));
      setSkillInput('');
    }
  };

  if (loading) return <div className="spinner" />;

  const STAT_ITEMS = [
    { icon: '📤', value: profile?.stats?.uploads || 0, label: 'Uploads' },
    { icon: '💬', value: profile?.stats?.discussions || 0, label: 'Discussions' },
    { icon: '✅', value: profile?.stats?.answers || 0, label: 'Answers' },
    { icon: '🏛️', value: profile?.stats?.clubs || 0, label: 'Clubs' },
    { icon: '🎉', value: profile?.stats?.events_attended || 0, label: 'Events' },
  ];

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Profile card */}
        <div className="card">
          <div style={{ padding: '28px', textAlign: 'center' }}>
            <div className="avatar avatar-lg" style={{ margin: '0 auto 16px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', color: 'white', fontSize: '1.8rem' }}>
              {profile?.name?.charAt(0)}
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 4 }}>{profile?.name}</h2>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginBottom: 12 }}>
              {profile?.branch}{profile?.year ? ` • Year ${profile.year}` : ''}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 18px', borderRadius: 20, fontWeight: 700, fontSize: '0.9rem', marginBottom: 16 }}>
              ⭐ {profile?.contribution_score} points
            </div>
            {profile?.bio && <p style={{ color: 'var(--gray-600)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: 16 }}>{profile.bio}</p>}
            {(profile?.skills || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                {profile.skills.map(s => <span key={s} className="badge badge-gray">{s}</span>)}
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: 16 }}>
              Joined {formatDate(profile?.created_at)}
            </div>
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setEditing(true); setTab('profile'); }}>
              ✏️ Edit Profile
            </button>
          </div>
        </div>

        {/* Right: Tabs */}
        <div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white', padding: '6px', borderRadius: 10, border: '1px solid var(--gray-200)', width: 'fit-content' }}>
            {[['profile', '🧑 Overview'], ['badges', '🏅 Badges'], ['leaderboard', '🏆 Leaderboard']].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: tab === t ? 'var(--primary)' : 'transparent', color: tab === t ? 'white' : 'var(--gray-600)', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === 'profile' && (
            <div>
              <div className="stats-row" style={{ marginBottom: 24 }}>
                {STAT_ITEMS.map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {editing && (
                <div className="card">
                  <div className="card-header"><span className="modal-title">Edit Profile</span></div>
                  <form onSubmit={handleSave}>
                    <div className="card-body">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Full Name</label>
                          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Branch</label>
                          <input className="form-input" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Year</label>
                          <select className="form-select" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                            <option value="">Select year</option>
                            {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Bio</label>
                        <textarea className="form-textarea" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell others about yourself..." style={{ minHeight: 80 }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Skills (press Enter to add)</label>
                        <div style={{ border: '1.5px solid var(--gray-300)', borderRadius: 8, padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(form.skills || []).map(s => (
                            <span key={s} className="tag">{s} <span className="tag-remove" onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(sk => sk !== s) }))}>✕</span></span>
                          ))}
                          <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill} placeholder="Add skill..." style={{ border: 'none', outline: 'none', flex: 1, minWidth: 100, fontSize: '0.875rem' }} />
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Badges tab */}
          {tab === 'badges' && (
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: 20 }}>
                Earn badges by contributing to the platform.
              </p>
              {(profile?.badges || []).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🏅</div>
                  <h3>No badges yet</h3>
                  <p>Contribute to earn your first badge!</p>
                </div>
              ) : (
                <div className="grid grid-3">
                  {profile.badges.map(badge => (
                    <div key={badge.id} className="card" style={{ textAlign: 'center', padding: '24px' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{badge.icon}</div>
                      <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{badge.name}</h3>
                      <p style={{ color: 'var(--gray-600)', fontSize: '0.8rem', marginBottom: 16 }}>{badge.description}</p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        Earned {formatDate(badge.awarded_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leaderboard tab */}
          {tab === 'leaderboard' && (
            <div className="card">
              <div className="card-header">
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>🏆 Contribution Leaderboard</span>
              </div>
              <div>
                {leaderboard.map((u, i) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--gray-100)', background: u.id === user?.id ? 'var(--primary-light)' : 'transparent' }}>
                    <div style={{ width: 32, fontWeight: 800, fontSize: '1rem', color: i < 3 ? ['#f59e0b','#9ca3af','#b45309'][i] : 'var(--gray-500)', textAlign: 'center' }}>
                      {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
                    </div>
                    <div className="avatar" style={{ background: 'var(--primary)', color: 'white' }}>{u.name?.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name} {u.id === user?.id && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>You</span>}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{u.branch}{u.year ? ` · Year ${u.year}` : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{u.contribution_score} pts</div>
                      {u.badge_count > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>🏅 {u.badge_count} badges</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
