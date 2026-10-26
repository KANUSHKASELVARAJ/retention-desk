import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { errMsg } from '../api.js';
import { Alert } from '../components/ui.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await login(f.email, f.password); nav('/'); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  return (
    <div className="login-wrap">
      <div className="login-art">
        <GraduationCap size={44} />
        <h1>Retention Desk</h1>
        <p>An ensemble of Random Forest, XGBoost and a neural network reads each student's record, scores dropout risk, explains the drivers, and proposes the next conversation to have.</p>
      </div>
      <form className="login-card" onSubmit={submit}>
        <h2>Faculty sign in</h2>
        <Alert>{err}</Alert>
        <label>Email<input type="email" required autoFocus value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <button className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
