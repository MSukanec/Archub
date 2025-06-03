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

  async getUserFromDatabase(authUserId: string): Promise<{ role: string; full_name: string } | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('auth_id', authUserId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user from database:', error);
        return { role: 'user', full_name: '' }; // Fallback to prevent infinite recursion
      }
      
      return data || { role: 'user', full_name: '' };
    } catch (err) {
      console.error('Exception in getUserFromDatabase:', err);
      return { role: 'user', full_name: '' };
    }
  },

  async signUp(email: string, password: string, firstName: string, lastName: string, organizationName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'admin', // Por defecto asignar rol de admin para pruebas
          organization: organizationName,
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
      } else {
        callback(null);
      }
    });
  },
};
