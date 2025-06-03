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
      // Obtener el user_id actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener el usuario interno
      const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!internalUser) {
        throw new Error('Usuario interno no encontrado');
      }

      // Actualizar la preferencia de tema en la base de datos
      const { error } = await supabase
        .from('user_preferences')
        .update({ theme: theme })
        .eq('user_id', internalUser.id);

      if (error) throw error;

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
      // Obtener la preferencia de tema desde la base de datos
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('theme')
        .eq('user_id', userId)
        .single();

      const theme = preferences?.theme || 'light';
      
      // Aplicar el tema
      set({ theme });
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Guardar en localStorage como respaldo
      localStorage.setItem('archmony-theme', theme);
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Si no se puede cargar el tema desde la BD, intentar localStorage
      const savedTheme = localStorage.getItem('archmony-theme') as Theme | null;
      const theme = savedTheme || 'light';
      
      set({ theme });
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
}));