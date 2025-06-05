import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '@/lib/supabase';
import { useUserContextStore } from './userContextStore';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => {
        console.log('AuthStore setUser called with:', user);
        
        // If user is changing (different ID or going from user to null), clear the user context
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.id !== user?.id) {
          console.log('User changed, clearing user context...');
          useUserContextStore.getState().clearUserContext();
        }
        
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });
        
        // If new user is set, initialize their context
        if (user) {
          console.log('Initializing context for new user:', user.id);
          setTimeout(() => {
            useUserContextStore.getState().initializeUserContext();
          }, 100);
        }
      },
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => {
        console.log('Logout called, clearing all user data...');
        
        // Clear user context first
        useUserContextStore.getState().clearUserContext();
        
        // Clear persisted storage
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('user-context-storage');
        
        // Then clear auth state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
