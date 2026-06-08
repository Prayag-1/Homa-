import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const requestUrl = err.config?.url || '';
    const isAuthRefresh = requestUrl.includes('/auth/refresh');
    const isAuthMutation =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/verify') ||
      requestUrl.includes('/auth/resend-verification') ||
      requestUrl.includes('/auth/logout');

    if (err.response?.status === 401 && !err.config._retry && !isAuthRefresh && !isAuthMutation) {
      err.config._retry = true;
      try {
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem('accessToken', data.data.accessToken);
        err.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(err.config);
      } catch {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
