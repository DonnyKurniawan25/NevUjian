import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Selamat datang, ${user.first_name || user.username}!`);
      if (redirect && user.role === 'student') {
        navigate(redirect);
      } else {
        navigate(user.role === 'student' ? '/student/dashboard' : '/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-layout">
      <div className="public-card" style={{ maxWidth: 420 }}>
        <div className="public-logo">
          <div className="public-logo-icon">N</div>
          <span className="public-logo-text">NevUjian</span>
        </div>
        <h2 className="public-title">Masuk ke Akun</h2>
        <p className="public-subtitle">Platform ujian online modern</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              id="login-username"
              type="text"
              className="form-input"
              placeholder="Masukkan username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Masukkan password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)'
                }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button id="login-submit" type="submit" className="btn btn-primary btn-lg" disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><LogIn size={18} /> Masuk</>}
          </button>
        </form>
      </div>
    </div>
  );
}
