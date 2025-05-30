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
  setProjectId: (projectId: string) => void;
  setBudgetId: (budgetId: string) => void;
  clearUserContext: () => void;
  initializeUserContext: () => Promise<void>;
  refreshData: () => Promise<void>;
  getOrganizationId: () => string | null;
  getProjectId: () => string | null;
  getBudgetId: () => string | null;
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
  getBudgetId: () => get().budgetId,

  setUserContext: (context) => {
    set((state) => ({ ...state, ...context }));
    
    // Update user_preferences in Supabase when context changes
    const updatePreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get internal user ID first
        const { data: internalUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!internalUser) return;

        // Try to update existing record first
        const { error: updateError } = await supabase
          .from('user_preferences')
          .update({
            last_organization_id: context.organizationId || get().organizationId,
            last_project_id: context.projectId || get().projectId,
            last_budget_id: context.budgetId || get().budgetId,
          })
          .eq('user_id', internalUser.id);

        // If update failed, try upsert
        if (updateError) {
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: internalUser.id,
              last_organization_id: context.organizationId || get().organizationId,
              last_project_id: context.projectId || get().projectId,
              last_budget_id: context.budgetId || get().budgetId,
            });
        }
      } catch (error) {
        console.error('Error updating user preferences:', error);
      }
    };

    updatePreferences();
  },

  setProjectId: (projectId: string) => {
    const currentState = get();
    set({ projectId });
    
    // Update preferences in Supabase
    const updatePreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: internalUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!internalUser) return;

        await supabase
          .from('user_preferences')
          .update({ last_project_id: projectId })
          .eq('user_id', internalUser.id);
      } catch (error) {
        console.error('Error updating project preference:', error);
      }
    };

    updatePreferences();
  },

  setBudgetId: (budgetId: string) => {
    console.log('setBudgetId called with:', budgetId);
    const currentState = get();
    set({ budgetId });
    
    // Update preferences in Supabase
    const updatePreferences = async () => {
      try {
        console.log('Starting budget preference update...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No authenticated user found');
          return;
        }

        console.log('Auth user found:', user.id);
        const { data: internalUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!internalUser) {
          console.log('No internal user found');
          return;
        }

        console.log('Internal user found:', internalUser.id);
        console.log('Updating budget preference to:', budgetId);
        
        const { data, error } = await supabase
          .from('user_preferences')
          .update({ last_budget_id: budgetId })
          .eq('user_id', internalUser.id)
          .select();

        if (error) {
          console.error('Supabase update error:', error);
        } else {
          console.log('Budget preference updated successfully:', data);
        }
      } catch (error) {
        console.error('Error updating budget preference:', error);
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
      // Step 1: Get auth.uid()
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        set({ isLoading: false, isInitialized: true });
        return;
      }

      const authUid = user.id;
      console.log('Auth UID:', authUid);

      // Step 2: Find internal user by auth_id
      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUid)
        .single();

      if (dbUserError || !dbUser) {
        console.error('No se pudo obtener el usuario interno:', dbUserError);
        set({ isLoading: false, isInitialized: true });
        return;
      }

      console.log('Usuario interno encontrado:', dbUser);

      // Step 3: Get user preferences using internal user.id
      const { data: prefs, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', dbUser.id)
        .single();

      if (prefsError || !prefs) {
        console.log('Preferencias no encontradas para usuario:', dbUser.id);
        
        // Try to create default preferences by finding user's first organization
        const { data: orgMembership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', dbUser.id)
          .limit(1)
          .maybeSingle();

        if (orgMembership?.organization_id) {
          console.log('Creando preferencias por defecto con organización:', orgMembership.organization_id);
          
          const { data: newPrefs, error: createError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: dbUser.id,
              last_organization_id: orgMembership.organization_id,
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creando preferencias:', createError);
            set({ isLoading: false, isInitialized: true });
            return;
          }

          console.log('Preferencias creadas exitosamente:', newPrefs);
          
          set({
            organizationId: newPrefs.last_organization_id,
            projectId: null,
            budgetId: null,
            planId: null,
            isLoading: false,
            isInitialized: true,
          });

          console.log('User context initialized successfully with new preferences');
          return;
        }
        
        console.log('No se encontró membresía de organización para el usuario');
        set({ isLoading: false, isInitialized: true });
        return;
      }

      console.log('Preferencias encontradas:', prefs);
      console.log('Organización activa:', prefs.last_organization_id);
      console.log('Proyecto activo:', prefs.last_project_id);

      set({
        organizationId: prefs.last_organization_id,
        projectId: prefs.last_project_id,
        budgetId: prefs.last_budget_id,
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