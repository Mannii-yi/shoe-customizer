import { create } from 'zustand';

const TOKEN_KEY = 'shoe-customizer-token';

function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export const useSessionStore = create((set) => ({
  token: getStoredToken(),
  user: null,

  setSession: ({ token, user }) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Storage may be unavailable.
    }

    set({ token, user });
  },

  clearSession: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage may be unavailable.
    }

    set({ token: null, user: null });
  },
}));
