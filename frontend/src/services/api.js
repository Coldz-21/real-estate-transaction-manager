import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle FormData content type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

// Loop API calls
export const loopAPI = {
  // CRUD operations
  getLoops: (params = {}) => api.get('/loops', { params }),
  getLoop: (id) => api.get(`/loops/${id}`),
  createLoop: (loopData) => api.post('/loops', loopData),
  updateLoop: (id, loopData) => api.put(`/loops/${id}`, loopData),
  deleteLoop: (id) => api.delete(`/loops/${id}`),
  archiveLoop: (id) => api.put(`/loops/${id}/archive`),
  
  // Dashboard and stats
  getStats: () => api.get('/loops/stats'),
  getClosingLoops: () => api.get('/loops/closing'),
  
  // Export functions
  exportCSV: (params = {}) => {
    return api.get('/loops/export/csv', { 
      params,
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv'
      }
    });
  },
  
  exportPDF: (id) => {
    return api.get(`/loops/${id}/export/pdf`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
  },

  // Image operations
  deleteLoopImage: (loopId, filename) => api.delete(`/loops/${loopId}/images/${filename}`)
};

// Settings API calls
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateNotificationPreferences: (preferences) => api.put('/settings/notifications', preferences)
};

// Admin API calls
export const adminAPI = {
  // User Management
  getAllUsers: () => api.get('/admin/users'),
  getUserActivitySummary: () => api.get('/admin/users/activity'),

  // Activity Logs
  getActivityLogs: (params = {}) => api.get('/admin/activity-logs', { params }),

  // Password Management
  changePassword: (data) => api.put('/admin/change-password', data),

  // User Suspension
  suspendUser: (userId) => api.put(`/admin/users/${userId}/suspend`),
  unsuspendUser: (userId) => api.put(`/admin/users/${userId}/unsuspend`),

  // Export Functions
  exportActivityLogs: (params = {}) => {
    return api.get('/admin/export/activity-logs', {
      params,
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv'
      }
    });
  },

  exportUserList: (params = {}) => {
    return api.get('/admin/export/users', {
      params,
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv'
      }
    });
  }
};

// Utility functions
export const apiUtils = {
  // Handle file download
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Format error messages
  getErrorMessage: (error) => {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Set authentication data
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Clear authentication data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default api;
