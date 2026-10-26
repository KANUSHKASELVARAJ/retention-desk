import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { Alert, Card, Empty, Pager, RiskBadge } from '../components/ui.jsx';
import { STATUSES, STATUS_LABEL, fmtDate } from '../constants.js';

export default function Interventions() {
  const [f, setF] = useState({ status: '', priority: '', mine: false, page: 1 });
  const [data, setData] = useState({ items: [], pages: 1, page: 1, total: 0 });
  const [err, setErr] = useState('');
  const load = () => api.get('/interventions', { params: { status: f.status || undefined, priority: f.priority || undefined, mine: f.mine ? 'true' : undefined, page: f.page } })
    .then((r) => setData(r.data)).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, [f]); // eslint-disable-line

  const setStatus = (id, status) => api.patch(`/interventions/${id}`, { status }).then(load).catch((e) => setErr(errMsg(e)));

  return (
    <>
      <div className="page-head"><div><h1>Interventions</h1><p className="muted">{data.total} items — track support from recommendation to completion.</p></div></div>
      <Alert>{err}</Alert>
      <Card>
        <div className="toolbar">
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value, page: 1 })}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
          <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value, page: 1 })}><option value="">All priorities</option>{['high', 'medium', 'low'].map((s) => <option key={s}>{s}</option>)}</select>
          <label className="check"><input type="checkbox" checked={f.mine} onChange={(e) => setF({ ...f, mine: e.target.checked, page: 1 })} /> Assigned to me</label>
        </div>
        {data.items.length ? (
          <div className="table-wrap"><table>
            <thead><tr><th>Student</th><th>Intervention</th><th>Priority</th><th>Assignee</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>{data.items.map((i) => (
              <tr key={i._id}>
                <td>{i.student ? <Link to={`/students/${i.student._id}`}><strong>{i.student.name}</strong></Link> : '—'}<br /><RiskBadge level={i.student?.risk?.level} /></td>
                <td><strong>{i.title}</strong><br /><span className="tag">{i.category}</span></td>
                <td><span className={`tag p-${i.priority}`}>{i.priority}</span></td>
                <td>{i.assignedTo?.name || '—'}</td>
                <td>{fmtDate(i.dueDate)}</td>
                <td><select value={i.status} onChange={(e) => setStatus(i._id, e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></td>
              </tr>))}</tbody>
          </table></div>
        ) : <Empty>Nothing here.</Empty>}
        <Pager page={data.page} pages={data.pages} onPage={(p) => setF({ ...f, page: p })} />
      </Card>
    </>
  );
}
