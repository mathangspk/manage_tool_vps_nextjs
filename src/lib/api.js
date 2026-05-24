import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the auth-token header
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['auth-token'] = token;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors (like unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Optional redirect to login could be handled here or in AuthContext
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email, password) => {
    const response = await apiClient.post('/users/login', { email, password });
    return response.data; // Expected { token, user: { _id, name, email, ... } }
  },
  register: async (userData) => {
    const response = await apiClient.post('/users/register', userData);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/user');
    return response.data; // Returns user without password
  },
  getUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data; // Returns list of users
  },
  updateUser: async (id, userData) => {
    const response = await apiClient.patch(`/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};

export const toolsApi = {
  getTools: async (searchParams) => {
    // searchParams contains { name, manufacturer, type, userName, status }
    const response = await apiClient.get('/api/tools/search', { params: searchParams });
    return response.data; // Returns array of tools
  },
  createTool: async (toolData) => {
    const response = await apiClient.post('/api/tools', toolData);
    return response.data;
  },
  updateTool: async (id, toolData) => {
    const response = await apiClient.patch(`/api/tools/${id}`, toolData);
    return response.data;
  },
  deleteTool: async (id) => {
    const response = await apiClient.delete(`/api/tools/${id}`);
    return response.data;
  },
};

export const ordersApi = {
  getOrders: async (searchParams) => {
    const response = await apiClient.get('/api/orders/search', { params: searchParams });
    return response.data; // Expected { Data: { Row: [...], Total: ... } }
  },
  getDashboardStats: async (searchParams) => {
    const response = await apiClient.get('/api/orders/dashboard', { params: searchParams });
    return response.data; // Expected { Data: { Row: [...] } }
  },
  getOrderById: async (id) => {
    const response = await apiClient.get(`/api/orders/${id}`);
    return response.data;
  },
  createOrder: async (orderData) => {
    const response = await apiClient.post('/api/orders', orderData);
    return response.data;
  },
  updateOrder: async (id, orderData) => {
    const response = await apiClient.patch(`/api/orders/${id}`, orderData);
    return response.data;
  },
  deleteOrder: async (id) => {
    const response = await apiClient.delete(`/api/orders/${id}`);
    return response.data;
  },
};

export const fastReportsApi = {
  getReports: async (params) => {
    const response = await apiClient.get('/api/fastReports/search', { params });
    return response.data; // Expected { Data: { Row: [...], Total: ... } }
  },
  getReportById: async (id) => {
    const response = await apiClient.get(`/api/fastReports/${id}`);
    return response.data;
  },
  createReport: async (reportData) => {
    const response = await apiClient.post('/api/fastReports', reportData);
    return response.data;
  },
  updateReport: async (id, reportData) => {
    const response = await apiClient.patch(`/api/fastReports/${id}`, reportData);
    return response.data;
  },
  deleteReport: async (id) => {
    const response = await apiClient.delete(`/api/fastReports/${id}`);
    return response.data;
  },
};

export const cchttsApi = {
  getCchtts: async (params) => {
    const response = await apiClient.get('/api/cchtts/search', { params });
    return response.data;
  },
  createCchtt: async (data) => {
    const response = await apiClient.post('/api/cchtts', data);
    return response.data;
  },
  updateCchtt: async (id, data) => {
    const response = await apiClient.patch(`/api/cchtts/${id}`, data);
    return response.data;
  },
  deleteCchtt: async (id) => {
    const response = await apiClient.delete(`/api/cchtts/${id}`);
    return response.data;
  },
};

export const cgsatsApi = {
  getCgsats: async (params) => {
    const response = await apiClient.get('/api/cgsats/search', { params });
    return response.data;
  },
  createCgsat: async (data) => {
    const response = await apiClient.post('/api/cgsats', data);
    return response.data;
  },
  updateCgsat: async (id, data) => {
    const response = await apiClient.patch(`/api/cgsats/${id}`, data);
    return response.data;
  },
  deleteCgsat: async (id) => {
    const response = await apiClient.delete(`/api/cgsats/${id}`);
    return response.data;
  },
};

export const bbdgktsApi = {
  getBbdgkts: async (params) => {
    const response = await apiClient.get('/api/bbdgkts/search', { params });
    return response.data;
  },
  getBbdgktById: async (id) => {
    const response = await apiClient.get(`/api/bbdgkts/${id}`);
    return response.data;
  },
  createBbdgkt: async (data) => {
    const response = await apiClient.post('/api/bbdgkts', data);
    return response.data;
  },
  updateBbdgkt: async (id, data) => {
    const response = await apiClient.patch(`/api/bbdgkts/${id}`, data);
    return response.data;
  },
  deleteBbdgkt: async (id) => {
    const response = await apiClient.delete(`/api/bbdgkts/${id}`);
    return response.data;
  },
};

export const bptcsApi = {
  getBptcs: async (params) => {
    const response = await apiClient.get('/api/bptcs/search', { params });
    return response.data;
  },
  getBptcById: async (id) => {
    const response = await apiClient.get(`/api/bptcs/${id}`);
    return response.data;
  },
  createBptc: async (data) => {
    const response = await apiClient.post('/api/bptcs', data);
    return response.data;
  },
  updateBptc: async (id, data) => {
    const response = await apiClient.patch(`/api/bptcs/${id}`, data);
    return response.data;
  },
  deleteBptc: async (id) => {
    const response = await apiClient.delete(`/api/bptcs/${id}`);
    return response.data;
  },
};

export const filesApi = {
  uploadFiles: async (formData) => {
    const response = await apiClient.post('/api/upload/upload-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  uploadPhotos: async (formData) => {
    const response = await apiClient.post('/api/upload/upload-photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  deleteFile: async (filename) => {
    const response = await apiClient.delete(`/api/upload/file/${filename}`);
    return response.data;
  },
  addFilesToBbdgkt: async (id, listFile) => {
    const response = await apiClient.patch(`/api/bbdgkts/addFiles/${id}`, { id, listFile });
    return response.data;
  },
  addFilesToBptc: async (id, listFile) => {
    const response = await apiClient.patch(`/api/bptcs/addFiles/${id}`, { id, listFile });
    return response.data;
  },
  addFilesToFastReport: async (id, listFile) => {
    const response = await apiClient.patch(`/api/fastReports/addFiles/${id}`, { id, listFile });
    return response.data;
  },
};

export default apiClient;
