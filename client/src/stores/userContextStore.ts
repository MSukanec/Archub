import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface UserContext {
  organizationId: string | null;
  projectId: string | null;
  budgetId: string | null;
  planId: string | null;
  // Cache for loaded data to avoid repeated queries
  organization: any | null;
  currentProjects: any[] | null;
  lastDataFetch: number | null;
}

interface UserContextStore extends UserContext {
  isLoading: boolean;
  isInitialized: boolean;
  setUserContext: (context: Partial<UserContext>) => void;
  clearUserContext: () => void;
  initializeUserContext: () => Promise<void>;
  refreshData: () => Promise<void>;
  getOrganizationId: () => string | null;
  getProjectId: () => string | null;
}

export const useUserContextStore = create<UserContextStore>((set, get) => ({
  organizationId: null,
  projectId: null,
  budgetId: null,
  planId: null,
  organization: null,
  currentProjects: null,
  lastDataFetch: null,
  isLoading: false,
  isInitialized: false,

  getOrganizationId: () => get().organizationId,
  getProjectId: () => get().projectId,

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
          });
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
      organization: null,
      currentProjects: null,
      lastDataFetch: null,
      isInitialized: false,
    });
  },

  refreshData: async () => {
    const state = get();
    if (!state.organizationId) return;

    try {
      // Fetch organization data
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', state.organizationId)
        .single();

      // Fetch projects for organization
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', state.organizationId)
        .eq('is_active', true);

      set({
        organization: orgData,
        currentProjects: projectsData || [],
        lastDataFetch: Date.now(),
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  },

  initializeUserContext: async () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, isInitialized: true });
        return;
      }

      console.log('Initializing user context for user:', user.id);

      // First try to get user preferences
      const { data: prefData } = await supabase
        .from('user_preferences')
        .select('*')
        .single(); // RLS will filter by auth.uid() automatically

      let organizationId = prefData?.last_organization_id;
      let projectId = prefData?.last_project_id;

      // If no preferences or no organization, try to find user's organization
      if (!organizationId) {
        console.log('No organization in preferences, finding user organization...');
        
        // Get user from users table using auth_id
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userData) {
          // Get organization membership
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userData.id)
            .single();

          if (memberData?.organization_id) {
            organizationId = memberData.organization_id;
            console.log('Found organization:', organizationId);
            
            // Save this organization as preference for next time
            await supabase
              .from('user_preferences')
              .upsert({
                user_id: user.id,
                last_organization_id: organizationId,
                last_project_id: projectId,
              });
          }
        }
      }

      set({
        organizationId,
        projectId,
        budgetId: prefData?.last_budget_id,
        isLoading: false,
        isInitialized: true,
      });

      // Refresh related data if we have an organization
      if (organizationId) {
        await get().refreshData();
      }
    } catch (error) {
      console.error('Error initializing user context:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },
}));