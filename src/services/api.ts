import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    interface RetryConfig extends InternalAxiosRequestConfig {
      _retry?: boolean;
    }
    const originalRequest = error.config as RetryConfig;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('access_token', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  adminLogin: async (email: string, password: string) => {
    const response = await api.post('/auth/admin/login', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// File API
export const fileAPI = {
  uploadFile: async (file: File, maxDownloads: number, expiryHours: number, visibility: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('maxDownloads', maxDownloads.toString());
    formData.append('expiryHours', expiryHours.toString());
    formData.append('visibility', visibility);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUserFiles: async () => {
    const response = await api.get('/files');
    return response.data;
  },

  getFileById: async (id: string) => {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },

  accessFileByToken: async (token: string) => {
    const response = await api.get(`/files/access/${token}`);
    return response.data;
  },

  downloadFileByToken: async (token: string) => {
    const response = await api.get(`/files/download/${token}`, {
      responseType: 'blob',
    });
    return response;
  },

  regenerateToken: async (id: string) => {
    const response = await api.patch(`/files/${id}/regenerate-token`);
    return response.data;
  },

  revokeFile: async (id: string) => {
    const response = await api.patch(`/files/${id}/revoke`);
    return response.data;
  },

  deleteFile: async (id: string) => {
    const response = await api.delete(`/files/${id}`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getAllFiles: async () => {
    const response = await api.get('/admin/files');
    return response.data;
  },

  getAllActivities: async () => {
    const response = await api.get('/admin/activities');
    return response.data;
  },

  deleteFile: async (id: string) => {
    const response = await api.delete(`/admin/files/${id}`);
    return response.data;
  },

  changeUserRole: async (id: string, role: string) => {
    const response = await api.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },
};

// Activity API
export const activityAPI = {
  getUserActivities: async () => {
    const response = await api.get('/activities');
    return response.data;
  },

  getFileActivities: async (fileId: string) => {
    const response = await api.get(`/activities/${fileId}`);
    return response.data;
  },
};

export default api;
