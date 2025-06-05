import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export const authService = {
  async signIn(email: string, password: string) {
    console.log('Attempting sign in with:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('Sign in response:', { data, error });
    return { data, error };
  },

  async getUserFromDatabase(authUserId: string): Promise<{ role: string; full_name: string; user_id?: string } | null> {
    try {
      // First try to get user through the linking system
      const { authLinkingService } = await import('./authLinkingService');
      const linkedUser = await authLinkingService.getUserFromDatabase(authUserId);
      
      if (linkedUser) {
        return linkedUser;
      }
      
      // Fallback to existing hardcoded logic for admin users
      const adminUsers = ['0f77f1c8-ecdf-4484-89a7-022c53f24d5a']; // lenga@gmail.com
      
      if (adminUsers.includes(authUserId)) {
        return { role: 'admin', full_name: 'Lenga', user_id: 'admin-fallback' };
      }
      
      // For regular users, return default user role
      return { role: 'user', full_name: '', user_id: 'user-fallback' };
      
    } catch (error) {
      console.error('Error in getUserFromDatabase:', error);
      
      // Final fallback
      const adminUsers = ['0f77f1c8-ecdf-4484-89a7-022c53f24d5a'];
      
      if (adminUsers.includes(authUserId)) {
        return { role: 'admin', full_name: 'Lenga', user_id: 'admin-fallback' };
      }
      
      return { role: 'user', full_name: '', user_id: 'user-fallback' };
    }
  },

  async signUp(email: string, password: string, firstName: string, lastName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'user', // Rol por defecto
          },
        },
      });

      if (error) {
        return { data, error };
      }

      // Si el registro fue exitoso, esperar un momento para que el trigger se ejecute
      if (data.user) {
        // Pequeña pausa para permitir que el trigger de base de datos se ejecute
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar que el usuario se creó correctamente en la tabla users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', data.user.id)
          .single();

        if (userError) {
          console.log('Usuario creado en auth pero no en tabla users:', userError);
        } else {
          console.log('Usuario creado correctamente:', userData);
        }
      }

      return { data, error };
    } catch (err) {
      console.error('Error en signUp:', err);
      return { data: null, error: err as any };
    }
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // First, handle auth linking to ensure user exists in internal system
          const { handleAuthLinking } = await import('./authLinkingService');
          const internalUserId = await handleAuthLinking(session.user as any);
          
          // Get user data from database table
          const dbUser = await this.getUserFromDatabase(session.user.id);
          
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: session.user.user_metadata?.first_name || '',
            lastName: session.user.user_metadata?.last_name || '',
            role: dbUser?.role || 'user', // Use role from database table
          };
          callback(authUser);
        } catch (error) {
          console.error('Error during auth state change:', error);
          
          // Fallback to basic auth user creation
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: session.user.user_metadata?.first_name || '',
            lastName: session.user.user_metadata?.last_name || '',
            role: 'user',
          };
          callback(authUser);
        }
      } else {
        callback(null);
      }
    });
  },
};
