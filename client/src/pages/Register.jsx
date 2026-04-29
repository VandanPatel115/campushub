import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Other'];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', branch: '', year: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register({ ...form, year: form.year ? parseInt(form.year) : null });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
      padding: '40px 20px',
    }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)', borderRadius: 20, padding: '48px', width: '100%', maxWidth: 520, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎓</div>
          <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800 }}>Join CampusHub</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Create your account and get started</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '0.875rem' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Full Name</label>
            <input className="form-input" placeholder="Alex Johnson" value={form.name} onChange={set('name')} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white' }} required />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Email Address</label>
            <input className="form-input" type="email" placeholder="you@campushub.edu" value={form.email} onChange={set('email')} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white' }} required />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Password</label>
            <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white' }} minLength={6} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Role</label>
              <select className="form-select" value={form.role} onChange={set('role')} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white' }}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
            {form.role === 'student' && (
              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Year</label>
                <select className="form-select" value={form.year} onChange={set('year')} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white' }}>
                  <option value="">Select year</option>
                  {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Branch / Department</label>
            <select className="form-select" value={form.branch} onChange={set('branch')} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white' }}>
              <option value="">Select branch</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '1rem', marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
