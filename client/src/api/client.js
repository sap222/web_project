import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const onLogin = err.config?.url === '/auth/login';
    if (err.response?.status === 401 && !onLogin) {
      localStorage.removeItem('token');
      window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err) => err.response?.data?.message || 'Something went wrong. Please try again.';

export default api;
