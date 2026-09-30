import { create } from 'zustand';
import { authApi, linksApi, clearToken, getToken, setToken } from '../lib/api.js';
import { parseApiError } from '../lib/api.js';
import { useNotificationStore } from './notificationStore.js';

/**
 * Global auth + page-data store.
 * `status` drives the skeleton screens so the app never flashes a spinner-less
 * blank frame.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  links: [],
  status: 'idle', // idle | loading | ready | error
  error: null,
  authChecked: false,
  /**
   * True for ~1s after login/signup. The guest guard uses it so the auth form
   * can play its success-checkmark animation before being redirected.
   */
  justSignedIn: false,
  /**
   * True from the moment a sign-out is requested until the router has actually
   * left the protected area.
   *
   * React batches the navigation and the session teardown into a single render,
   * so during that render the location is still /dashboard while the user is
   * already null. Without this flag the protected guard reads that intermediate
   * state and issues its own /login redirect, which then wins over the intended
   * landing page — the exact stale-URL bug. The guard suspends while it is set.
   */
  loggingOut: false,

  /** Restore a session from the stored JWT on first paint. */
  bootstrap: async () => {
    if (!getToken()) {
      set({ authChecked: true, status: 'idle' });
      return;
    }
    set({ status: 'loading' });
    try {
      const { user, links } = await authApi.me();
      set({ user, links, status: 'ready', authChecked: true, error: null });
    } catch (err) {
      const { status } = parseApiError(err);
      if (status === 401) clearToken();
      set({
        user: null,
        links: [],
        status: 'idle',
        authChecked: true,
        error: status === 401 ? null : parseApiError(err).message,
      });
    }
  },

  login: async (credentials) => {
    const data = await authApi.login(credentials);
    setToken(data.token);
    const { user, links } = await authApi.me();
    set({ user, links, status: 'ready', error: null, justSignedIn: true });
    setTimeout(() => set({ justSignedIn: false }), 1200);
    return user;
  },

  signup: async (payload) => {
    const data = await authApi.signup(payload);
    setToken(data.token);
    const { user, links } = await authApi.me();
    set({ user, links, status: 'ready', error: null, justSignedIn: true });
    setTimeout(() => set({ justSignedIn: false }), 1200);
    return user;
  },

  /**
   * Tears down the session. The caller is responsible for navigating away from
   * any protected route *before* calling this — if the user is dropped first,
   * the route guard sees `user === null` on a protected path and redirects to
   * /login, which is the stale-URL bug this ordering exists to prevent.
   */
  logout: () => {
    clearToken();
    set({ loggingOut: true });
    set({
      user: null,
      links: [],
      status: 'idle',
      error: null,
      justSignedIn: false,
    });
    // The badge belongs to the account that just left, so it must not survive
    // into whoever signs in next on this machine.
    useNotificationStore.getState().reset();
  },

  setUser: (user) => set({ user }),

  /** Released by the router once it is safely off every protected route. */
  setLoggingOut: (loggingOut) => set({ loggingOut }),

  setLinks: (links) => set({ links }),

  /** Optimistically patch one link, rolling back if the request fails. */
  patchLink: async (id, patch) => {
    const previous = get().links;
    set({ links: previous.map((l) => (l._id === id ? { ...l, ...patch } : l)) });
    try {
      const saved = await linksApi.update(id, patch);
      set({ links: get().links.map((l) => (l._id === id ? saved : l)) });
      return saved;
    } catch (err) {
      set({ links: previous });
      throw err;
    }
  },

  /** Refresh the link list from the server (after add/delete/reorder). */
  refreshLinks: async () => {
    const links = await linksApi.list();
    set({ links });
    return links;
  },
}));
