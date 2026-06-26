import { create } from "zustand";
import { decodeUserFromToken } from "../auth/tokens";

export type UserStore<T extends object> = {
  user: T | null;
  setUser: (accessToken: string | null) => void;
  updateUser: <K extends keyof T>(key: K, payload: T[K]) => void;
  getUser: () => T | null;
  clearUser: () => void;
};

export function createUserStore<T extends Record<string, unknown>>() {
  return create<UserStore<T>>((set, get) => ({
    user: null,

    setUser(accessToken) {
      const user = decodeUserFromToken<T>(accessToken);
      set({ user });
    },

    updateUser(key, payload) {
      set((state) => ({
        user: state.user ? { ...state.user, [key]: payload } : state.user,
      }));
    },

    getUser() {
      return get().user;
    },

    clearUser() {
      set({ user: null });
    },
  }));
}
