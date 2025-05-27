import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface UserContext {
  organizationId: string | null;
  projectId: string | null;
  budgetId: string | null;
  planId: string | null;
}

interface UserContextStore extends UserContext {
  isLoading: boolean;
  setUserContext: (context: Partial<UserContext>) => void;
  clearUserContext: () => void;
  initializeUserContext: () => Promise<void>;
}

export const useUserContextStore = create<UserContextStore>((set, get) => ({
  organizationId: null,
  projectId: null,
  budgetId: null,
  planId: null,
  isLoading: false,

  setUserContext: (context) => {
    set((state) => ({ ...state, ...context }));
    
    // Update user_preferences in Supabase when context changes
    const updatePreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            last_organization_id: context.organizationId || get().organizationId,
            last_project_id: context.projectId || get().projectId,
            last_budget_id: context.budgetId || get().budgetId,
          })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error updating user preferences:', error);
      }
    };

    updatePreferences();
  },

  clearUserContext: () => {
    set({
      organizationId: null,
      projectId: null,
      budgetId: null,
      planId: null,
    });
  },

  initializeUserContext: async () => {
    set({ isLoading: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      // Get user preferences using auth.uid() directly
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .single(); // RLS will filter by auth.uid() automatically

      if (data) {
        set({
          organizationId: data.last_organization_id,
          projectId: data.last_project_id,
          budgetId: data.last_budget_id,
          isLoading: false,
        });
      } else {
        // If no preferences exist yet, that's normal for new users
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error initializing user context:', error);
      set({ isLoading: false });
    }
  },
}));