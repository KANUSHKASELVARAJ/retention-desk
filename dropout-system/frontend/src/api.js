import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 30000 });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => {
  const d = e.response?.data;
  if (d?.details?.missing) return `${d.error}: missing ${d.details.missing.join(', ')}`;
  if (Array.isArray(d?.details)) return `${d.error}: ${d.details.map((x) => `${x.path} ${x.message}`).join('; ')}`;
  return d?.error || e.message || 'Something went wrong';
};

export default api;
