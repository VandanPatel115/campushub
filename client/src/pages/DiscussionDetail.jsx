import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/api';

function VoteButton({ value, count, myVote, onVote }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <button onClick={() => onVote(1)} style={{ background: 'none', border: `2px solid ${myVote === 1 ? 'var(--primary)' : 'var(--gray-300)'}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: myVote === 1 ? 'var(--primary)' : 'var(--gray-500)', fontWeight: 700, fontSize: '1rem' }}>▲</button>
      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: count > 0 ? 'var(--success)' : count < 0 ? 'var(--danger)' : 'var(--gray-700)' }}>{count}</span>
      <button onClick={() => onVote(-1)} style={{ background: 'none', border: `2px solid ${myVote === -1 ? 'var(--danger)' : 'var(--gray-300)'}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: myVote === -1 ? 'var(--danger)' : 'var(--gray-500)', fontWeight: 700, fontSize: '1rem' }}>▼</button>
    </div>
  );
}

export default function DiscussionDetail() {
  const { id } = useParams();
  const { user, apiFetch } = useAuth();
  const navigate = useNavigate();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchDiscussion = async () => {
    const res = await apiFetch(`/api/discussions/${id}`);
    const data = await res.json();
    setDiscussion(data);
    setLoading(false);
  };

  useEffect(() => { fetchDiscussion(); }, [id]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/discussions/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchDiscussion();
      setComment('');
      showToast('Answer posted! +2 points');
    } catch (err) { showToast(err.message, 'error'); }
    setSubmitting(false);
  };

  const handleVoteDiscussion = async (value) => {
    const res = await apiFetch(`/api/discussions/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    await fetchDiscussion();
  };

  const handleVoteComment = async (commentId, value) => {
    await apiFetch(`/api/discussions/comments/${commentId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    await fetchDiscussion();
  };

  const handleAccept = async (commentId) => {
    await apiFetch(`/api/discussions/comments/${commentId}/accept`, { method: 'PATCH' });
    await fetchDiscussion();
  };

  if (loading) return <div className="spinner" />;
  if (!discussion) return <div className="empty-state"><h3>Discussion not found</h3></div>;

  return (
    <div style={{ maxWidth: 820 }}>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/discussions')} style={{ marginBottom: 20 }}>← Back to Discussions</button>

      {/* Question */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <VoteButton count={discussion.vote_count} myVote={discussion.my_vote} onVote={handleVoteDiscussion} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {discussion.is_solved && <span className="badge badge-success">✓ Solved</span>}
                {(discussion.tags || []).map(tag => <span key={tag} className="badge badge-primary">{tag}</span>)}
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark)', marginBottom: 16, lineHeight: 1.4 }}>{discussion.title}</h1>
              <div style={{ color: 'var(--gray-700)', lineHeight: 1.8, marginBottom: 20, fontSize: '0.95rem' }}>{discussion.content}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--gray-500)', alignItems: 'center' }}>
                <div className="avatar avatar-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{discussion.author_name?.charAt(0)}</div>
                <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{discussion.author_name}</span>
                {discussion.author_branch && <span>· {discussion.author_branch}</span>}
                <span>· {timeAgo(discussion.created_at)}</span>
                <span>· {discussion.view_count} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'var(--dark)' }}>
          {discussion.comments?.length || 0} Answer{discussion.comments?.length !== 1 ? 's' : ''}
        </h2>

        {(discussion.comments || []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            No answers yet. Be the first to answer!
          </div>
        ) : (discussion.comments || []).map(c => (
          <div key={c.id} className="card" style={{ marginBottom: 12, borderLeft: c.is_accepted ? '4px solid var(--success)' : 'none' }}>
            <div style={{ padding: '20px 24px', display: 'flex', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <VoteButton count={c.vote_count} myVote={c.my_vote} onVote={(v) => handleVoteComment(c.id, v)} />
                {c.is_accepted ? (
                  <div title="Accepted answer" style={{ fontSize: '1.3rem' }}>✅</div>
                ) : (
                  discussion.author_id === user?.id && (
                    <button
                      onClick={() => handleAccept(c.id)}
                      title="Mark as accepted"
                      style={{ background: 'none', border: '2px solid var(--success)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}
                    >✓</button>
                  )
                )}
              </div>
              <div style={{ flex: 1 }}>
                {c.is_accepted && (
                  <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem', marginBottom: 8 }}>✅ Accepted Answer</div>
                )}
                <div style={{ color: 'var(--gray-700)', lineHeight: 1.8, marginBottom: 16, fontSize: '0.9rem' }}>{c.content}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem', color: 'var(--gray-500)', alignItems: 'center' }}>
                  <div className="avatar avatar-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{c.author_name?.charAt(0)}</div>
                  <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{c.author_name}</span>
                  {c.author_branch && <span>· {c.author_branch}</span>}
                  <span>· {timeAgo(c.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Post answer */}
      <div className="card">
        <div className="card-header"><span className="modal-title">Your Answer</span></div>
        <div className="card-body">
          <form onSubmit={handleComment}>
            <div className="form-group">
              <textarea
                className="form-textarea"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write your answer here. Be clear, concise, and helpful..."
                style={{ minHeight: 140 }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Answer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
