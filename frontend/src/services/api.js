import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Containers API
export const containersAPI = {
  getAll: () => api.get('/containers'),
  getById: (id) => api.get(`/containers/${id}`),
  create: (containerData) => api.post('/containers', containerData),
  update: (id, containerData) => api.put(`/containers/${id}`, containerData),
  delete: (id) => api.delete(`/containers/${id}`),
  start: (id) => api.post(`/containers/${id}/start`),
  stop: (id) => api.post(`/containers/${id}/stop`),
  restart: (id) => api.post(`/containers/${id}/restart`),
  getLogs: (id) => api.get(`/containers/${id}/logs`),
  getStats: (id) => api.get(`/containers/${id}/stats`),
};

// Deployments API
export const deploymentsAPI = {
  getAll: () => api.get('/deployments'),
  getById: (id) => api.get(`/deployments/${id}`),
  create: (deploymentData) => api.post('/deployments', deploymentData),
  update: (id, deploymentData) => api.put(`/deployments/${id}`, deploymentData),
  delete: (id) => api.delete(`/deployments/${id}`),
  updateStatus: (id, status) => api.patch(`/deployments/${id}/status`, { status }),
};

// GitHub API
export const githubAPI = {
  getRepos: (token) => api.get('/github/repos', {
    headers: { 'github-token': token }
  }),
  getRepoDetails: (owner, repo, token) => api.get(`/github/repos/${owner}/${repo}`, {
    headers: { 'github-token': token }
  }),
  getBranches: (owner, repo, token) => api.get(`/github/repos/${owner}/${repo}/branches`, {
    headers: { 'github-token': token }
  }),
  deploy: (deploymentData, token) => api.post('/github/deploy', deploymentData, {
    headers: { 'github-token': token }
  }),
};

// Domains API
export const domainsAPI = {
  getAll: () => api.get('/domains'),
  getById: (id) => api.get(`/domains/${id}`),
  create: (domainData) => api.post('/domains', domainData),
  update: (id, domainData) => api.put(`/domains/${id}`, domainData),
  delete: (id) => api.delete(`/domains/${id}`),
  enableSSL: (id) => api.post(`/domains/${id}/ssl`),
  disableSSL: (id) => api.delete(`/domains/${id}/ssl`),
};

// Monitoring API
export const monitoringAPI = {
  getStats: () => api.get('/monitoring/stats'),
  getMetrics: () => api.get('/monitoring/metrics'),
  getAlerts: () => api.get('/monitoring/alerts'),
  createAlert: (alertData) => api.post('/monitoring/alerts', alertData),
  updateAlert: (id, alertData) => api.put(`/monitoring/alerts/${id}`, alertData),
  deleteAlert: (id) => api.delete(`/monitoring/alerts/${id}`),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (settingsData) => api.put('/settings', settingsData),
  testConnection: (connectionData) => api.post('/settings/test-connection', connectionData),
};

export default api; 