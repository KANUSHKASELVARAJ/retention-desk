import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Activity, Bell, ClipboardList, GraduationCap, LayoutDashboard, LogOut, Menu, Users as UsersIcon, UserCog } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import api from '../api.js';

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () => api.get('/notifications').then((r) => setUnread(r.data.unread)).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    window.addEventListener('notifications-changed', load);
    return () => { clearInterval(t); window.removeEventListener('notifications-changed', load); };
  }, []);

  const link = (to, Icon, label, badge) => (
    <NavLink to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <Icon size={18} /> <span>{label}</span>{badge > 0 && <b className="badge-count">{badge}</b>}
    </NavLink>
  );

  return (
    <div className="shell">
      <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Menu"><Menu /></button>
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="brand"><GraduationCap size={26} /><div><strong>Retention Desk</strong><small>Dropout early-warning</small></div></div>
        <nav>
          {link('/', LayoutDashboard, 'Dashboard')}
          {link('/students', UsersIcon, 'Students')}
          {link('/interventions', ClipboardList, 'Interventions')}
          {link('/notifications', Bell, 'Notifications', unread)}
          {link('/model', Activity, 'Model')}
          {user.role === 'admin' && link('/users', UserCog, 'Staff accounts')}
        </nav>
        <div className="me">
          <div><strong>{user.name}</strong><small>{user.role}</small></div>
          <button className="icon-btn" onClick={logout} title="Sign out"><LogOut size={18} /></button>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}
