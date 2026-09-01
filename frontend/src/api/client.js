import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hrms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh and unauthorized responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('hrms_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh/', { refresh: refreshToken });
          const newAccessToken = res.data.access;
          localStorage.setItem('hrms_access_token', newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Token refresh failed - clean storage and redirect to login
          localStorage.removeItem('hrms_access_token');
          localStorage.removeItem('hrms_refresh_token');
          localStorage.removeItem('hrms_user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('hrms_access_token');
        localStorage.removeItem('hrms_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
