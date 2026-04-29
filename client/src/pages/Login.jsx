import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px', color: 'white',
        background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(6,182,212,0.2))',
      }}>
        <div style={{ maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
            }}>🎓</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>CampusHub</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>ONE PLATFORM FOR EVERYTHING COLLEGE</div>
            </div>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 20 }}>
            Your Campus,<br />All in One Place
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', lineHeight: 1.7 }}>
            Notices, study materials, timetables, events, clubs, and discussions — all unified for your college life.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['📢 Smart Notice Board', '📚 Study Hub with file sharing', '🎉 Events & Club management', '💬 Discussion forum', '🧑‍🎓 Profile & Leaderboard'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.8)' }}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px', background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800 }}>Welcome back</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Sign in to your account</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@campushub.edu"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white' }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white' }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '1rem', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#818cf8', fontWeight: 600 }}>Create one</Link>
          </div>

          <div style={{ marginTop: 24, padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Demo credentials:</strong><br />
            Admin: admin@campushub.edu / admin123<br />
            Student: alex@campushub.edu / student123
          </div>
        </div>
      </div>
    </div>
  );
}
