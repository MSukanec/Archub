import { create } from 'zustand';

// Dark mode only - simplified theme store
interface ThemeStore {
  theme: 'dark';
  isLoading: boolean;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'dark',
  isLoading: false,

  initializeTheme: () => {
    // Always force dark mode
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#1e1e1e';
    set({ theme: 'dark' });
  }
}));