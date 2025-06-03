import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  isLoading: boolean;
  setTheme: (theme: Theme) => Promise<void>;
  initializeTheme: (userId: string) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'light',
  isLoading: false,

  setTheme: async (theme: Theme) => {
    set({ isLoading: true });
    
    try {
      // Guardar en localStorage como respaldo
      localStorage.setItem('archmony-theme', theme);

      // Actualizar el tema en el store
      set({ theme });
      
      // Aplicar la clase al documento
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
    } catch (error) {
      console.error('Error updating theme:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  initializeTheme: async (userId: string) => {
    try {
      // Intentar cargar desde localStorage primero
      const savedTheme = localStorage.getItem('archmony-theme') as Theme | null;
      const theme = savedTheme || 'light';
      
      // Aplicar el tema
      set({ theme });
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Si no se puede cargar el tema, usar light por defecto
      set({ theme: 'light' });
      document.documentElement.classList.remove('dark');
    }
  }
}));