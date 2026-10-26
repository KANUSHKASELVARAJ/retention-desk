import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../api.js';
import { Alert, Card, Empty, RiskBadge } from '../components/ui.jsx';
import { RISK_COLORS, STATUS_LABEL, courseName, pct } from '../constants.js';

const Stat = ({ label, value, color, to }) => (
  <Link to={to || '#'} className="stat" style={{ borderTopColor: color }}>
    <small>{label}</small><strong>{value ?? '…'}</strong>
  </Link>
);

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [o, setO] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([api.get('/analytics/summary'), api.get('/analytics/overview')])
    .then(([a, b]) => { setS(a.data); setO(b.data); }).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, []);

  const assessPending = async () => {
    setBusy(true); setErr(''); setMsg('');
    try {
      const { data } = await api.post('/students/predict-pending');
      setMsg(`Assessed ${data.assessed} students (${data.highRisk} high risk).${data.failures.length ? ` ${data.failures.length} failed: ${data.failures[0].error}` : ''}`);
      await load();
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };

  const pie = s ? [['low', s.low], ['medium', s.medium], ['high', s.high], ['unassessed', s.unassessed]].map(([name, value]) => ({ name, value })).filter((x) => x.value > 0) : [];

  return (
    <>
      <div className="page-head">
        <div><h1>Dashboard</h1><p className="muted">Where to focus support this week.</p></div>
        {s?.unassessed > 0 && <button className="btn primary" disabled={busy} onClick={assessPending}>{busy ? 'Assessing…' : `Assess ${Math.min(s.unassessed, 100)} pending students`}</button>}
      </div>
      <Alert>{err}</Alert><Alert kind="ok">{msg}</Alert>

      <div className="stats">
        <Stat label="Total students" value={s?.total} color="#1d2733" to="/students" />
        <Stat label="Low risk" value={s?.low} color={RISK_COLORS.low} to="/students?level=low" />
        <Stat label="Medium risk" value={s?.medium} color={RISK_COLORS.medium} to="/students?level=medium" />
        <Stat label="High risk" value={s?.high} color={RISK_COLORS.high} to="/students?level=high" />
        <Stat label="Open interventions" value={s?.openInterventions} color="#0f5c5c" to="/interventions" />
      </div>

      <div className="grid-2">
        <Card title="Risk distribution">
          {pie.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2} label>
                {pie.map((p) => <Cell key={p.name} fill={RISK_COLORS[p.name]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer>
          ) : <Empty>No students yet. Add students or import the dataset.</Empty>}
        </Card>

        <Card title="Highest-risk students">
          {s?.topRisk?.length ? (
            <ul className="list">
              {s.topRisk.map((t) => (
                <li key={t._id}><Link to={`/students/${t._id}`}>{t.name}<small>{t.studentId}</small></Link><span><b>{pct(t.risk.score)}</b> <RiskBadge level={t.risk.level} /></span></li>
              ))}
            </ul>
          ) : <Empty>No high-risk students.</Empty>}
        </Card>

        <Card title="Average risk by course">
          {o?.byCourse?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={o.byCourse.map((c) => ({ ...c, name: courseName(c.course) }))} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => pct(v)} />
                <Bar dataKey="avgRisk" name="Avg. risk" fill="#0f5c5c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty>Run predictions to see course analytics.</Empty>}
        </Card>

        <Card title="Most common risk factors">
          {o?.topFactors?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={o.topFactors} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="factor" width={190} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Students" fill="#b8392f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty>No factor data yet.</Empty>}
        </Card>

        <Card title="Average predicted risk — last 30 days">
          {o?.trend?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={o.trend}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} /><Tooltip formatter={(v, n) => (n === 'Avg. risk' ? pct(v) : v)} />
                <Line type="monotone" dataKey="avgRisk" name="Avg. risk" stroke="#0f5c5c" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty>No predictions in the last 30 days.</Empty>}
        </Card>

        <Card title="Intervention pipeline">
          {o?.interventionStatus?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={o.interventionStatus.map((x) => ({ ...x, name: STATUS_LABEL[x.status] }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Interventions" fill="#1d2733" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty>No interventions yet.</Empty>}
        </Card>
      </div>
    </>
  );
}
