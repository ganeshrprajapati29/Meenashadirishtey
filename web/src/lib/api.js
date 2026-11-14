import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: `${API_BASE}/api`, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('msr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || (err.code === 'ECONNABORTED' ? 'Request timed out' : 'Network error, please try again');
    if (status === 401 && localStorage.getItem('msr_token')) {
      localStorage.removeItem('msr_token');
      window.dispatchEvent(new Event('msr:logout'));
    }
    return Promise.reject({ status, message, data: err.response?.data });
  }
);

/** absolute URL for an uploaded file */
export const fileUrl = (p) => (!p ? null : p.startsWith('http') ? p : `${API_BASE}${p}`);

export const avatarFor = (gender) => (gender === 'female' ? '/brand/avatar-female.svg' : '/brand/avatar-male.svg');

export default api;
