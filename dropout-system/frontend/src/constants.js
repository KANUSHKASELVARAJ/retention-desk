export const RISK_COLORS = { low: '#2f7d4f', medium: '#c98a12', high: '#b8392f', unassessed: '#8a8f98' };
export const STATUSES = ['recommended', 'planned', 'in_progress', 'completed', 'dismissed'];
export const STATUS_LABEL = { recommended: 'Recommended', planned: 'Planned', in_progress: 'In progress', completed: 'Completed', dismissed: 'Dismissed' };
export const CATEGORIES = ['academic', 'financial', 'counseling', 'engagement', 'administrative'];

// Course codes documented on the UCI dataset page; unknown codes fall back to "Course <code>".
export const COURSES = {
  33: 'Biofuel Production Technologies', 171: 'Animation & Multimedia Design', 8014: 'Social Service (evening)',
  9003: 'Agronomy', 9070: 'Communication Design', 9085: 'Veterinary Nursing', 9119: 'Informatics Engineering',
  9130: 'Equinculture', 9147: 'Management', 9238: 'Social Service', 9254: 'Tourism', 9500: 'Nursing',
  9556: 'Oral Hygiene', 9670: 'Advertising & Marketing Mgmt', 9773: 'Journalism & Communication',
  9853: 'Basic Education', 9991: 'Management (evening)',
};
export const courseName = (c) => COURSES[c] || (c == null ? '—' : `Course ${c}`);
export const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`);
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
