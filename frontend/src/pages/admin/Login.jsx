import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await login(email, pass);
      nav('/admin');
    } catch (e2) {
      setErr(e2.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-4)' }}>
      <div className="admin-card" style={{ width: '100%', maxWidth: 420 }}>
        <h2 style={{ marginBottom: 'var(--sp-2)' }}>Admin Sign In</h2>
        <p className="text-muted text-small" style={{ marginBottom: 'var(--sp-5)' }}>Sign in to manage website content.</p>
        <form className="admin-form" onSubmit={submit}>
          <label>
            <span>Email</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </label>
          <label>
            <span>Password</span>
            <input type="password" required value={pass} onChange={e => setPass(e.target.value)} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          {err && <div style={{ color: 'var(--color-danger)', fontSize: '.9rem' }}>{err}</div>}
        </form>
      </div>
    </div>
  );
}
