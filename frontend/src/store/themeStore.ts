import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const applyDomTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const getInitialTheme = (): Theme => {
  if (typeof localStorage === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  return stored === 'dark' ? 'dark' : 'light';
};

const initial = getInitialTheme();
applyDomTheme(initial);

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: initial,
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    applyDomTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyDomTheme(next);
    set({ theme: next });
  },
}));
