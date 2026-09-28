import axios from 'axios';

/**
 * API client.
 * In development Vite proxies `/api` to the Express server, so an empty base
 * URL keeps requests same-origin. In production VITE_API_URL points at the
 * deployed backend and that origin must be whitelisted in the server's CORS list.
 */
const baseURL = `${import.meta.env.VITE_API_URL || ''}/api`;

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

const TOKEN_KEY = 'libpro.token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Attach the JWT to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Normalises API errors into `{ message, fieldErrors, status }` so components
 * never have to inspect Axios internals.
 */
export const parseApiError = (error) => {
  const response = error?.response;
  if (!response) {
    return {
      message:
        error?.code === 'ECONNABORTED'
          ? 'That took too long. Please try again.'
          : 'Cannot reach the server. Is the backend running?',
      fieldErrors: {},
      status: 0,
    };
  }

  const { message, errors } = response.data || {};
  const fieldErrors = {};
  (errors || []).forEach((e) => {
    if (e.field) fieldErrors[e.field] = e.message;
  });

  return { message: message || 'Something went wrong', fieldErrors, status: response.status };
};

/* ------------------------------------------------------------------ auth */

export const authApi = {
  signup: (payload) => api.post('/auth/signup', payload).then((r) => r.data.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  checkUsername: (username) =>
    api.get(`/auth/username/${encodeURIComponent(username)}`).then((r) => r.data.data),
  me: () => api.get('/user/me').then((r) => r.data.data),
  updateProfile: (payload) => api.put('/user/me', payload).then((r) => r.data.data.user),
  /**
   * Changing the login email re-checks the account password on the server. The
   * token alone is not enough, so an email can never be redirected by a hijacked
   * session or a walk-away-from-unlocked-browser.
   */
  changeEmail: (email, currentPassword) =>
    api.put('/user/email', { email, currentPassword }).then((r) => r.data.data.user),
  changePassword: (payload) => api.put('/user/password', payload).then((r) => r.data.data),
  publish: () => api.post('/user/publish').then((r) => r.data.data),
  deleteAccount: () => api.delete('/user/me').then((r) => r.data),
};

/* ----------------------------------------------------------------- links */

export const linksApi = {
  list: () => api.get('/links').then((r) => r.data.data.links),
  create: (payload) => api.post('/links', payload).then((r) => r.data.data.link),
  update: (id, payload) => api.put(`/links/${id}`, payload).then((r) => r.data.data.link),
  remove: (id) => api.delete(`/links/${id}`).then((r) => r.data),
  reorder: (linkIds) => api.put('/links/reorder', { linkIds }).then((r) => r.data.data.links),
};

/* ---------------------------------------------------------------- public */

export const publicApi = {
  profile: (username) => api.get(`/public/${encodeURIComponent(username)}`).then((r) => r.data.data),
  registerView: (username) => api.post(`/public/${encodeURIComponent(username)}/view`),
  registerClick: (linkId) => api.post(`/links/${encodeURIComponent(linkId)}/click`),
};

/* ------------------------------------------------------------- analytics */

export const analyticsApi = {
  summary: (range = 7) => api.get(`/analytics/summary?range=${range}`).then((r) => r.data.data),
};

/* ----------------------------------------------------------------- admin */

/**
 * Read-only admin endpoints.
 *
 * Nothing in this file can modify anything — the server exposes no admin
 * mutation routes, so there is deliberately no create/update/delete method to
 * reach for. The 403 the server returns for a non-admin is surfaced by
 * `parseApiError` like any other failure.
 */
export const adminApi = {
  overview: (range = 7) => api.get(`/admin/overview?range=${range}`).then((r) => r.data.data),
  users: ({ q = '', page = 1, limit = 25 } = {}) =>
    api
      .get('/admin/users', { params: { q: q || undefined, page, limit } })
      .then((r) => r.data.data),
  user: (id) => api.get(`/admin/users/${id}`).then((r) => r.data.data),
  top: (limit = 10) => api.get(`/admin/top?limit=${limit}`).then((r) => r.data.data),
  platforms: () => api.get('/admin/platforms').then((r) => r.data.data),
};
