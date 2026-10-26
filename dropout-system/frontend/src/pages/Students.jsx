import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api, { errMsg } from '../api.js';
import { Alert, Card, Empty, Pager, RiskBadge } from '../components/ui.jsx';
import { courseName, pct } from '../constants.js';

export default function Students() {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState(sp.get('search') || '');
  const [err, setErr] = useState('');
  const level = sp.get('level') || '';
  const page = Number(sp.get('page') || 1);
  const sort = sp.get('sort') || '-risk';
  const q = sp.get('search') || '';

  useEffect(() => {
    api.get('/students', { params: { page, level: level || undefined, search: q || undefined, sort } })
      .then((r) => setData(r.data)).catch((e) => setErr(errMsg(e)));
  }, [page, level, q, sort]);

  const set = (patch) => { const n = new URLSearchParams(sp); Object.entries({ page: 1, ...patch }).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k))); setSp(n); };

  return (
    <>
      <div className="page-head">
        <div><h1>Students</h1><p className="muted">{data.total} records</p></div>
        <Link to="/students/new" className="btn primary"><Plus size={16} /> Add student</Link>
      </div>
      <Alert>{err}</Alert>
      <Card>
        <div className="toolbar">
          <form onSubmit={(e) => { e.preventDefault(); set({ search }); }} className="search">
            <Search size={16} /><input placeholder="Search name, ID, email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
          <select value={level} onChange={(e) => set({ level: e.target.value })}>
            <option value="">All risk levels</option>
            {['high', 'medium', 'low', 'unassessed'].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={sort} onChange={(e) => set({ sort: e.target.value, page: 1 })}>
            <option value="-risk">Highest risk first</option><option value="risk">Lowest risk first</option>
            <option value="name">Name A–Z</option><option value="-createdAt">Newest</option>
          </select>
        </div>
        {data.items.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>ID</th><th>Risk</th><th>Score</th><th>Predicted class</th><th>Last assessed</th></tr></thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s._id}>
                    <td><Link to={`/students/${s._id}`}><strong>{s.name}</strong></Link></td>
                    <td>{s.studentId}</td>
                    <td><RiskBadge level={s.risk?.level} /></td>
                    <td>{pct(s.risk?.score)}</td>
                    <td>{s.risk?.predictedClass || '—'}</td>
                    <td>{s.risk?.predictedAt ? new Date(s.risk.predictedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty>No students match.</Empty>}
        <Pager page={data.page} pages={data.pages} onPage={(p) => set({ page: p })} />
      </Card>
    </>
  );
}
