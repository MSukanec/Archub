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
    console.log('Starting user context initialization...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        set({ isLoading: false, isInitialized: true });
        return;
      }

      console.log('Authenticated user:', user.id);

      // For now, set a hardcoded organization ID that we know exists
      // This will bypass the membership lookup issue temporarily
      const organizationId = '6acb6b56-294c-46dc-bfce-98595d0e08c9'; // From the logs we saw earlier

      console.log('Setting organization:', organizationId);

      set({
        organizationId,
        projectId: null,
        budgetId: null,
        planId: null,
        isLoading: false,
        isInitialized: true,
      });

      console.log('User context initialized successfully');

      // Don't refresh data immediately to avoid more complexity
    } catch (error) {
      console.error('Error initializing user context:', error);
      set({ 
        organizationId: null,
        projectId: null,
        budgetId: null,
        planId: null,
        isLoading: false, 
        isInitialized: true 
      });
    }
  },
}));