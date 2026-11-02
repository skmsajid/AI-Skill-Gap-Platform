import axios from 'axios';

// Helper to get CSRF token from document cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to ensure CSRF cookie is set
let csrfPromise = null;
export async function ensureCsrfToken() {
  if (getCookie('csrftoken')) {
    return getCookie('csrftoken');
  }
  if (!csrfPromise) {
    csrfPromise = axios.get('/api/accounts/csrf/', { withCredentials: true })
      .then((res) => {
        csrfPromise = null;
        return res.data?.csrfToken || getCookie('csrftoken');
      })
      .catch((err) => {
        csrfPromise = null;
        console.warn('Could not retrieve CSRF token:', err);
        return null;
      });
  }
  return csrfPromise;
}

// Request interceptor to attach CSRF token
api.interceptors.request.use(async (config) => {
  const method = config.method ? config.method.toLowerCase() : 'get';
  if (!['get', 'head', 'options'].includes(method)) {
    let csrfToken = getCookie('csrftoken');
    if (!csrfToken) {
      csrfToken = await ensureCsrfToken();
    }
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
});

// Accounts API
export const authAPI = {
  getCsrf: () => api.get('/accounts/csrf/'),
  register: (data) => api.post('/accounts/register/', data),
  login: (data) => api.post('/accounts/login/', data),
  logout: () => api.post('/accounts/logout/'),
  getProfile: () => api.get('/accounts/profile/'),
  updateProfile: (data) => api.put('/accounts/profile/', data),
  checkAuth: () => api.get('/accounts/check/'),
};

// Resumes API
export const resumeAPI = {
  getCurrent: () => api.get('/resumes/current/'),
  getAll: () => api.get('/resumes/'),
  upload: (formData) => api.post('/resumes/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/resumes/${id}/`),
};

// Jobs API
export const jobsAPI = {
  getAll: () => api.get('/jobs/'),
  getById: (id) => api.get(`/jobs/${id}/`),
  create: (data) => api.post('/jobs/', data),
  update: (id, data) => api.put(`/jobs/${id}/`, data),
  delete: (id) => api.delete(`/jobs/${id}/`),
};

// Analysis API
export const analysisAPI = {
  run: (data) => api.post('/analysis/run/', data),
  getAll: () => api.get('/analysis/history/'),
  getById: (id) => api.get(`/analysis/history/${id}/`),
  delete: (id) => api.delete(`/analysis/history/${id}/`),
  getProgress: () => api.get('/analysis/progress/'),
  updateProgress: (id, status) => api.patch(`/analysis/progress/${id}/`, { status }),
  getDashboardSummary: () => api.get('/analysis/dashboard-summary/'),
};

export default api;
