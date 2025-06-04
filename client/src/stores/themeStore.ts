import { create } from 'zustand';

// Theme store with light/dark mode support
interface ThemeStore {
  theme: 'light' | 'dark';
  isLoading: boolean;
  initializeTheme: () => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'dark',
  isLoading: false,

  initializeTheme: () => {
    // Check localStorage for saved theme preference, default to dark
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const preferredTheme = savedTheme || 'dark';
    
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(preferredTheme);
    
    set({ theme: preferredTheme });
  },

  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  setTheme: (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    localStorage.setItem('theme', theme);
    set({ theme });
  }
}));