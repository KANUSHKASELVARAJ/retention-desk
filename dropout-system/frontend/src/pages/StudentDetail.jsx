import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Pencil, Play, Trash2 } from 'lucide-react';
import api, { errMsg } from '../api.js';
import { Alert, Card, Empty, RiskBadge } from '../components/ui.jsx';
import { CATEGORIES, RISK_COLORS, STATUSES, STATUS_LABEL, courseName, fmtDate, pct } from '../constants.js';

const MODEL_NAMES = { random_forest: 'Random Forest', xgboost: 'XGBoost', ann: 'ANN', ensemble: 'Ensemble' };

function InterventionRow({ it, users, onChange }) {
  const [note, setNote] = useState('');
  const patch = (body) => api.patch(`/interventions/${it._id}`, body).then(onChange);
  return (
    <li className="intervention">
      <div className="int-top">
        <div><strong>{it.title}</strong>
          <div className="tags"><span className="tag">{it.category}</span><span className={`tag p-${it.priority}`}>{it.priority}</span>{it.source === 'system' && <span className="tag">model-suggested</span>}</div></div>
        <select value={it.status} onChange={(e) => patch({ status: e.target.value })}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
      </div>
      {it.description && <p className="muted small">{it.description}</p>}
      <div className="int-meta">
        <label>Assignee<select value={it.assignedTo?._id || ''} onChange={(e) => patch({ assignedTo: e.target.value || null })}>
          <option value="">Unassigned</option>{users.map((u) => <option key={u.id || u._id} value={u._id}>{u.name}</option>)}</select></label>
        <label>Due<input type="date" value={it.dueDate ? it.dueDate.slice(0, 10) : ''} onChange={(e) => e.target.value && patch({ dueDate: e.target.value })} /></label>
      </div>
      {it.notes?.map((n) => <p key={n._id} className="note"><b>{n.authorName}</b> · {fmtDate(n.createdAt)} — {n.text}</p>)}
      <form className="note-form" onSubmit={(e) => { e.preventDefault(); if (note.trim()) patch({ note }).then(() => setNote('')); }}>
        <input placeholder="Add progress note…" value={note} onChange={(e) => setNote(e.target.value)} /><button className="btn ghost">Add</button>
      </form>
    </li>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [student, setStudent] = useState(null);
  const [preds, setPreds] = useState([]);
  const [ints, setInts] = useState([]);
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState({ title: '', category: 'counseling', priority: 'medium' });

  const load = useCallback(async () => {
    try {
      const [s, p, i] = await Promise.all([api.get(`/students/${id}`), api.get(`/students/${id}/predictions`), api.get(`/students/${id}/interventions`)]);
      setStudent(s.data.student); setPreds(p.data.predictions); setInts(i.data.interventions);
    } catch (e) { setErr(errMsg(e)); }
  }, [id]);
  useEffect(() => { load(); api.get('/auth/users').then((r) => setUsers(r.data.users)).catch(() => {}); }, [load]);

  const predict = async () => {
    setBusy(true); setErr('');
    try { await api.post(`/students/${id}/predict`); await load(); window.dispatchEvent(new Event('notifications-changed')); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const remove = async () => { if (confirm(`Delete ${student.name} and all related records?`)) { await api.delete(`/students/${id}`); nav('/students'); } };
  const addManual = async (e) => {
    e.preventDefault();
    try { await api.post('/interventions', { ...manual, student: id }); setManual({ ...manual, title: '' }); load(); } catch (x) { setErr(errMsg(x)); }
  };

  if (!student) return <><Alert>{err}</Alert>{!err && <p>Loading…</p>}</>;
  const latest = preds[0];
  const modelBars = latest ? [
    ...Object.entries(latest.modelOutputs || {}).map(([k, v]) => ({ name: MODEL_NAMES[k] || k, p: v.Dropout })),
    { name: 'Ensemble', p: latest.riskScore },
  ] : [];
  const history = [...preds].reverse().map((p) => ({ date: new Date(p.createdAt).toLocaleDateString(), score: p.riskScore }));

  return (
    <>
      <div className="page-head">
        <div><h1>{student.name}</h1>
          <p className="muted">{student.studentId} · {courseName(student.features?.course)}{student.knownOutcome && ` · recorded outcome: ${student.knownOutcome}`}</p></div>
        <div className="actions">
          <Link to={`/students/${id}/edit`} className="btn ghost"><Pencil size={15} /> Edit</Link>
          <button className="btn ghost danger" onClick={remove}><Trash2 size={15} /> Delete</button>
          <button className="btn primary" onClick={predict} disabled={busy}><Play size={15} /> {busy ? 'Running models…' : latest ? 'Re-run prediction' : 'Run prediction'}</button>
        </div>
      </div>
      <Alert>{err}</Alert>

      {!latest ? <Card><Empty>No prediction yet. Run the ensemble to score this student.</Empty></Card> : (
        <>
          <div className="grid-3">
            <Card title="Ensemble dropout risk" className="gauge-card">
              <div className="gauge" style={{ color: RISK_COLORS[latest.riskLevel] }}>{pct(latest.riskScore)}</div>
              <RiskBadge level={latest.riskLevel} />
              <p className="muted small">Predicted outcome: <b>{latest.predictedClass}</b><br />Assessed {fmtDate(latest.createdAt)}</p>
              <div className="probs">{Object.entries(latest.classProbabilities || {}).map(([c, v]) => <div key={c}><span>{c}</span><div className="bar"><i style={{ width: pct(v) }} /></div><b>{pct(v)}</b></div>)}</div>
            </Card>
            <Card title="P(Dropout) by model">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={modelBars}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} /><Tooltip formatter={(v) => pct(v)} />
                  <Bar dataKey="p" radius={[4, 4, 0, 0]}>{modelBars.map((m) => <Cell key={m.name} fill={m.name === 'Ensemble' ? '#0f5c5c' : '#9bb7b7'} />)}</Bar></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Risk history">
              {history.length > 1 ? (
                <ResponsiveContainer width="100%" height={230}><LineChart data={history}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} /><Tooltip formatter={(v) => pct(v)} /><Line dataKey="score" stroke="#b8392f" strokeWidth={2} /></LineChart></ResponsiveContainer>
              ) : <Empty>Run another prediction to build a trend.</Empty>}
            </Card>
          </div>

          <div className="grid-2">
            <Card title="Why this score — risk factors">
              {latest.riskFactors.length ? (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(150, latest.riskFactors.length * 38)}>
                    <BarChart data={latest.riskFactors} layout="vertical" margin={{ left: 20 }}><XAxis type="number" hide />
                      <YAxis type="category" dataKey="label" width={200} tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => v.toFixed(2)} />
                      <Bar dataKey="impact" name="Impact (log-odds)" fill="#b8392f" radius={[0, 4, 4, 0]} /></BarChart>
                  </ResponsiveContainer>
                  <ul className="plain">{latest.riskFactors.map((f) => <li key={f.feature}><b>{f.label}</b> = {f.value}</li>)}</ul>
                </>
              ) : <Empty>No factors pushing risk upward.</Empty>}
              {latest.protectiveFactors?.length > 0 && <><h4>Protective factors</h4><ul className="plain">{latest.protectiveFactors.map((f) => <li key={f.feature}>{f.label} = {f.value}</li>)}</ul></>}
              <p className="muted small">Impacts are per-student TreeSHAP contributions from the XGBoost model toward the Dropout class.</p>
            </Card>

            <Card title="Prediction history">
              <div className="table-wrap"><table><thead><tr><th>Date</th><th>Risk</th><th>Score</th><th>Class</th></tr></thead>
                <tbody>{preds.map((p) => <tr key={p._id}><td>{new Date(p.createdAt).toLocaleString()}</td><td><RiskBadge level={p.riskLevel} /></td><td>{pct(p.riskScore)}</td><td>{p.predictedClass}</td></tr>)}</tbody></table></div>
            </Card>
          </div>
        </>
      )}

      <Card title="Interventions">
        {ints.length ? <ul className="interventions">{ints.map((it) => <InterventionRow key={it._id} it={it} users={users} onChange={load} />)}</ul> : <Empty>No interventions yet — they are generated from each prediction, or add one below.</Empty>}
        <form className="manual" onSubmit={addManual}>
          <input required minLength={3} placeholder="Add a manual intervention…" value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} />
          <select value={manual.category} onChange={(e) => setManual({ ...manual, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={manual.priority} onChange={(e) => setManual({ ...manual, priority: e.target.value })}>{['low', 'medium', 'high'].map((c) => <option key={c}>{c}</option>)}</select>
          <button className="btn primary">Add</button>
        </form>
      </Card>
    </>
  );
}
