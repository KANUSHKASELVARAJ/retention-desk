import { RISK_COLORS } from '../constants.js';

export const RiskBadge = ({ level }) => (
  <span className="pill" style={{ background: `${RISK_COLORS[level || 'unassessed']}1f`, color: RISK_COLORS[level || 'unassessed'] }}>
    {level || 'unassessed'}
  </span>
);

export const Alert = ({ children, kind = 'error' }) => (children ? <div className={`alert ${kind}`}>{children}</div> : null);

export const Card = ({ title, action, children, className = '' }) => (
  <section className={`card ${className}`}>
    {(title || action) && <header className="card-head"><h3>{title}</h3>{action}</header>}
    {children}
  </section>
);

export const Pager = ({ page, pages, onPage }) => (
  <div className="pager">
    <button className="btn ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
    <span>Page {page} of {pages}</span>
    <button className="btn ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
  </div>
);

export const Empty = ({ children }) => <p className="empty">{children}</p>;
