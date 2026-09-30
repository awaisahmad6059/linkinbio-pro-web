import { create } from 'zustand';
import { notificationsApi, parseApiError } from '../lib/api.js';

/**
 * The dashboard's notification bell.
 *
 * `unread` is the only thing polled, and only the count endpoint is hit, so a
 * tab left open costs one small query every POLL_MS rather than dragging the
 * whole list down each time. The list itself is fetched when the panel is
 * actually opened, or when a poll notices the count has moved.
 *
 * Polling rather than a socket is a deliberate choice: this API is deployed as
 * Netlify Functions, where a long-lived SSE or WebSocket connection is cut off
 * by the platform's execution limit. A 15-second poll fits comfortably inside
 * the poll limiter's ceiling.
 */

const POLL_MS = 15_000;

/** Not polled while the tab is hidden — a background tab has nobody watching a badge. */
const canPoll = () => typeof document === 'undefined' || document.visibilityState === 'visible';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unread: 0,
  loading: false,
  error: '',
  open: false,
  loaded: false,
  lastCheckedAt: 0,

  setOpen: (open) => {
    set({ open });
    // Opening the panel is the moment the list is worth fetching.
    if (open) get().fetchAll();
  },

  /** Polls the count only. Never throws, never blocks a render. */
  checkUnread: async () => {
    try {
      const { unread } = await notificationsApi.unreadCount();
      const previous = get().unread;
      set({ unread, lastCheckedAt: Date.now() });

      // A count that moved while the panel is closed means there is something
      // new to show, so the list is refreshed ready for the next open.
      if (unread > previous && get().loaded) get().fetchAll();
    } catch {
      // Offline, throttled or signed out. The badge keeps its last known value
      // rather than flashing a wrong zero, and the next poll will retry.
    }
  },

  fetchAll: async () => {
    if (get().loading) return;
    set({ loading: true, error: '' });
    try {
      const data = await notificationsApi.list();
      set({
        notifications: data.notifications,
        unread: data.unread,
        loaded: true,
        loading: false,
        error: '',
      });
    } catch (err) {
      set({ loading: false, error: parseApiError(err).message });
    }
  },

  /** Optimistic: the row dims immediately, and rolls back if the save fails. */
  markRead: async (id) => {
    const target = get().notifications.find((n) => n.id === id);
    if (!target || target.read) return;

    set({
      notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unread: Math.max(0, get().unread - 1),
    });

    try {
      const data = await notificationsApi.markRead(id);
      set({ unread: data.unread });
    } catch {
      set({
        notifications: get().notifications.map((n) => (n.id === id ? target : n)),
        unread: target.read ? get().unread : get().unread + 1,
      });
    }
  },

  markAllRead: async () => {
    if (get().unread === 0) return;
    const previous = get().notifications;
    const previousUnread = get().unread;

    set({
      notifications: previous.map((n) => ({ ...n, read: true })),
      unread: 0,
    });

    try {
      await notificationsApi.markAllRead();
    } catch {
      set({ notifications: previous, unread: previousUnread });
    }
  },

  /** Cleared on sign-out so the next account never inherits the last one's badge. */
  reset: () =>
    set({ notifications: [], unread: 0, loaded: false, open: false, error: '', lastCheckedAt: 0 }),

  /**
   * Starts the poll and keeps it running. Returns the teardown, so a component
   * that unmounts — signing out, or a route change away from the shell — cannot
   * leave an interval behind.
   */
  startPolling: () => {
    get().checkUnread();
    const id = setInterval(() => {
      if (canPoll()) get().checkUnread();
    }, POLL_MS);

    // Coming back to the tab is the other moment worth an immediate check: the
    // interval was paused, and the user has no idea how long they were away.
    const onVisible = () => {
      if (canPoll()) get().checkUnread();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  },
}));

export default useNotificationStore;
