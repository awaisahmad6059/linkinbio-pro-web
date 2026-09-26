import { create } from 'zustand';

let nextId = 1;

/** Lightweight toast queue used for save/delete/error feedback. */
export const useToastStore = create((set, get) => ({
  toasts: [],

  push: (message, tone = 'success', ttl = 3200) => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, message, tone }] });
    setTimeout(() => get().dismiss(id), ttl);
    return id;
  },

  success: (message, ttl) => get().push(message, 'success', ttl),
  error: (message, ttl = 4200) => get().push(message, 'error', ttl),
  info: (message, ttl) => get().push(message, 'info', ttl),

  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
