import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { Alert, Card } from '../components/ui.jsx';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'faculty' });
  const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  const load = () => api.get('/auth/users').then((r) => setUsers(r.data.users));
  useEffect(() => { load(); }, []);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    try { await api.post('/auth/register', f); setOk(`Account created for ${f.email}`); setF({ name: '', email: '', password: '', role: 'faculty' }); load(); }
    catch (x) { setErr(errMsg(x)); }
  };
  return (
    <>
      <div className="page-head"><h1>Staff accounts</h1></div>
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      <div className="grid-2">
        <Card title="Create account">
          <form onSubmit={submit} className="stack">
            <label>Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label>Email<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
            <label>Password (min 8)<input required minLength={8} type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
            <label>Role<select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="faculty">Faculty</option><option value="admin">Admin</option></select></label>
            <button className="btn primary">Create</button>
          </form>
        </Card>
        <Card title="Existing accounts"><ul className="list">{users.map((u) => <li key={u._id}><span>{u.name}<small>{u.email}</small></span><span className="tag">{u.role}</span></li>)}</ul></Card>
      </div>
    </>
  );
}
