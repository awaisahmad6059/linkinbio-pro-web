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
 * Admin surface.
 *
 * The GET helpers are read-only platform views. The mutation helpers drive the
 * per-user account actions (suspend, reset password, verified flag, delete,
 * verification-code resend, request handling) and are only reachable by an
 * account whose role is actually `admin` on the server.
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
  setStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data.data.user),
  resetPassword: (id, password) => api.put(`/admin/users/${id}/password`, { password }).then((r) => r.data.data),
  setEmailVerified: (id, emailVerified) =>
    api.patch(`/admin/users/${id}/email-verified`, { emailVerified }).then((r) => r.data.data.user),
  removeUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  notifyUser: (id, message) =>
    api.post(`/admin/users/${id}/notify`, { message }).then((r) => r.data.data),
  requests: ({ status = 'open', page = 1, limit = 25 } = {}) =>
    api
      .get('/admin/requests', { params: { status, page, limit } })
      .then((r) => r.data.data),
  /**
   * Ids for one tab, no rows. Backs "select all", which has to cover every
   * request in the tab rather than just the current page, so the selection is
   * not silently truncated at 25.
   */
  requestIds: (status = 'open') =>
    api.get('/admin/requests/ids', { params: { status } }).then((r) => r.data.data),
  setRequestStatus: (id, status, extra = {}) =>
    api.patch(`/admin/requests/${id}`, { status, ...extra }).then((r) => r.data.data.request),
  /** One call for any selection size, so partial and select-all share a path. */
  deleteRequests: (ids) =>
    api.post('/admin/requests/bulk-delete', { ids }).then((r) => r.data.data),
};

/* --------------------------------------------------------- notifications */

/**
 * The dashboard bell.
 *
 * `unreadCount` is the only call made on a timer, and it returns a single
 * integer, so a long-lived tab stays cheap. `list` is fetched when the panel
 * opens, not on a schedule.
 */
export const notificationsApi = {
  list: (page = 1, limit = 20) =>
    api.get('/notifications', { params: { page, limit } }).then((r) => r.data.data),
  unreadCount: () => api.get('/notifications/unread-count').then((r) => r.data.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data.data),
};

/* --------------------------------------------------------------- requests */

/**
 * The user->admin help desk. Anyone can raise a request: an email that does not
 * match a known account gets the same polite answer as a real one, so the API
 * never reveals whether an account exists.
 */
export const requestsApi = {
  create: (payload) => api.post('/requests', payload).then((r) => r.data),
};
