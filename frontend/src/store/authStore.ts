import { create } from 'zustand';
import type { User } from '../types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

const storedUser = localStorage.getItem('user');

export const useAuthStore = create<AuthStore>((set) => ({
  user: storedUser ? (JSON.parse(storedUser) as User) : null,
  accessToken: localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,
  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },
  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
    set({ accessToken: token });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, accessToken: null });
  },
}));
