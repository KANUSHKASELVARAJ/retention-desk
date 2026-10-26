import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { Alert, Card, Empty } from '../components/ui.jsx';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const load = () => api.get('/notifications').then((r) => { setItems(r.data.items); window.dispatchEvent(new Event('notifications-changed')); }).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, []);
  const read = (id) => api.patch(`/notifications/${id}/read`).then(load);
  const readAll = () => api.patch('/notifications/read-all').then(load);

  return (
    <>
      <div className="page-head"><div><h1>Notifications</h1></div>
        <button className="btn ghost" onClick={readAll} disabled={!items.some((i) => !i.read)}>Mark all read</button></div>
      <Alert>{err}</Alert>
      <Card>
        {items.length ? <ul className="notes">{items.map((n) => (
          <li key={n._id} className={n.read ? 'read' : ''} onClick={() => !n.read && read(n._id)}>
            <span className={`dot t-${n.type}`} />
            <div><strong>{n.title}</strong><p>{n.message}</p>
              <small>{new Date(n.createdAt).toLocaleString()} {n.student && <Link to={`/students/${n.student._id}`}>· open student</Link>}</small></div>
          </li>))}</ul> : <Empty>You're all caught up.</Empty>}
      </Card>
    </>
  );
}
