import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { Alert, Card } from '../components/ui.jsx';
import { COURSES } from '../constants.js';

export default function StudentForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [schema, setSchema] = useState([]);
  const [base, setBase] = useState({ studentId: '', name: '', email: '' });
  const [vals, setVals] = useState({});
  const [err, setErr] = useState('');
  const [schemaErr, setSchemaErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/analytics/ml/schema').then((r) => setSchema(r.data.features)).catch((e) => setSchemaErr(errMsg(e)));
    if (id) api.get(`/students/${id}`).then(({ data: { student: s } }) => {
      setBase({ studentId: s.studentId, name: s.name, email: s.email || '' });
      setVals(Object.fromEntries(Object.entries(s.features || {}).map(([k, v]) => [k, String(v)])));
    }).catch((e) => setErr(errMsg(e)));
  }, [id]);

  const fillMeans = () => setVals(Object.fromEntries(schema.map((f) => [f.key, String(f.isInteger ? Math.round(f.mean) : f.mean)])));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const missing = schema.filter((f) => vals[f.key] === undefined || vals[f.key] === '');
    if (missing.length) { setErr(`Please fill: ${missing.map((m) => m.label).join(', ')}`); setBusy(false); return; }
    try {
      const body = { ...base, features: Object.fromEntries(schema.map((f) => [f.key, Number(vals[f.key])])) };
      const { data } = id ? await api.put(`/students/${id}`, body) : await api.post('/students', body);
      nav(`/students/${data.student._id}`);
    } catch (x) { setErr(errMsg(x)); setBusy(false); }
  };

  const input = (f) => {
    const v = vals[f.key] ?? '';
    const on = (e) => setVals({ ...vals, [f.key]: e.target.value });
    if (f.key === 'course') return (
      <select required value={v} onChange={on}><option value="">Select…</option>
        {Object.entries(COURSES).map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}</select>);
    if (f.isBinary) return <select required value={v} onChange={on}><option value="">Select…</option><option value="0">0</option><option value="1">1</option></select>;
    return <input required type="number" value={v} onChange={on} min={f.min} max={f.max} step={f.isInteger ? 1 : 'any'} placeholder={`${f.min} – ${f.max}`} />;
  };

  return (
    <>
      <div className="page-head"><div><h1>{id ? 'Edit student' : 'Add student'}</h1>
        <p className="muted">Fields come from the trained model's schema, so every value is something the model actually uses.</p></div></div>
      <Alert>{schemaErr}</Alert><Alert>{err}</Alert>
      <form onSubmit={submit}>
        <Card title="Identity">
          <div className="form-grid">
            <label>Student ID<input required value={base.studentId} onChange={(e) => setBase({ ...base, studentId: e.target.value })} /></label>
            <label>Full name<input required minLength={2} value={base.name} onChange={(e) => setBase({ ...base, name: e.target.value })} /></label>
            <label>Email (optional)<input type="email" value={base.email} onChange={(e) => setBase({ ...base, email: e.target.value })} /></label>
          </div>
        </Card>
        <Card title={`Model inputs (${schema.length})`} action={schema.length > 0 && <button type="button" className="btn ghost" onClick={fillMeans}>Fill with dataset averages</button>}>
          <p className="muted small">Categorical fields use the numeric codes defined in the UCI data dictionary. Hints show the range seen in training data.</p>
          <div className="form-grid">
            {schema.map((f) => <label key={f.key}>{f.label}{input(f)}</label>)}
          </div>
        </Card>
        <div className="actions"><button className="btn ghost" type="button" onClick={() => nav(-1)}>Cancel</button>
          <button className="btn primary" disabled={busy || !schema.length}>{busy ? 'Saving…' : 'Save student'}</button></div>
      </form>
    </>
  );
}
