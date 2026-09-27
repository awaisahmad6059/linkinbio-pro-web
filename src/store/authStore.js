import { create } from 'zustand';
import { authApi, linksApi, clearToken, getToken, setToken } from '../lib/api.js';
import { parseApiError } from '../lib/api.js';

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

  logout: () => {
    clearToken();
    // `justSignedIn` is cleared as well: it gates the guest-route redirect, and
    // leaving it true would strand a signed-out visitor on the login screen
    // instead of the landing page.
    set({ user: null, links: [], status: 'idle', error: null, justSignedIn: false });
  },

  setUser: (user) => set({ user }),

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
