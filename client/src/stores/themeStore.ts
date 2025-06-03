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

      // Actualizar o insertar la preferencia de tema
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: internalUser.id,
          theme: theme
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

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
      // Obtener la preferencia de tema del usuario
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
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Si no se puede cargar el tema, usar light por defecto
      set({ theme: 'light' });
      document.documentElement.classList.remove('dark');
    }
  }
}));