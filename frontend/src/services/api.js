import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Jewelry API
export const jewelryAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return api.get(`/jewelry?${params.toString()}`);
  },
  getById: (id) => api.get(`/jewelry/${id}`),
  create: (data) => api.post('/jewelry', data),
  update: (id, data) => api.put(`/jewelry/${id}`, data),
  delete: (id) => api.delete(`/jewelry/${id}`),
  getLowStock: () => api.get('/jewelry/low-stock'),
  getStats: () => api.get('/jewelry/stats'),
  adjustStock: (id, data) => api.post(`/jewelry/${id}/adjust-stock`, data),
  getMovements: (jewelryId = null, limit = 100) => {
    const params = new URLSearchParams();
    if (jewelryId) params.append('jewelry_id', jewelryId);
    params.append('limit', limit);
    return api.get(`/jewelry/movements?${params.toString()}`);
  },
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Metals API
export const metalsAPI = {
  getAll: () => api.get('/metals'),
  getById: (id) => api.get(`/metals/${id}`),
  create: (data) => api.post('/metals', data),
  update: (id, data) => api.put(`/metals/${id}`, data),
  delete: (id) => api.delete(`/metals/${id}`),
};

// Stones API
export const stonesAPI = {
  getAll: () => api.get('/stones'),
  getById: (id) => api.get(`/stones/${id}`),
  create: (data) => api.post('/stones', data),
  update: (id, data) => api.put(`/stones/${id}`, data),
  delete: (id) => api.delete(`/stones/${id}`),
};

export default api;
