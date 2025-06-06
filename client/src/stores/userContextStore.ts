import { create } from 'zustand';
import { supabase } from '../../lib/supabase';

interface UserPreferences {
  id: string;
  user_id: string;
  last_organization_id: string | null;
  last_project_id: string | null;
  last_budget_id: string | null;
  theme: 'light' | 'dark';
}

interface UserContext {
  organizationId: string | null;
  projectId: string | null;
  budgetId: string | null;
  planId: string | null;
  userId: string | null; // Internal user ID
  preferences: UserPreferences | null;
  // Cache for loaded data to avoid repeated queries
  organization: any | null;
  currentProjects: any[] | null;
  lastDataFetch: number | null;
}

interface UserContextStore extends UserContext {
  isLoading: boolean;
  isInitialized: boolean;
  updateInProgress: boolean;
  pendingUpdates: NodeJS.Timeout | null;
  setUserContext: (context: Partial<UserContext>) => void;
  setOrganizationId: (organizationId: string) => void;
  setProjectId: (projectId: string) => void;
  setBudgetId: (budgetId: string) => void;
  clearUserContext: () => void;
  initializeUserContext: () => Promise<void>;
  refreshData: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  getOrganizationId: () => string | null;
  getProjectId: () => string | null;
  getBudgetId: () => string | null;
}

export const useUserContextStore = create<UserContextStore>((set, get) => ({
  organizationId: null,
  projectId: null,
  budgetId: null,
  planId: null,
  userId: null,
  preferences: null,
  organization: null,
  currentProjects: null,
  lastDataFetch: null,
  isLoading: false,
  isInitialized: false,
  updateInProgress: false,
  pendingUpdates: null,

  getOrganizationId: () => get().organizationId,
  getProjectId: () => get().projectId,
  getBudgetId: () => get().budgetId,

  setUserContext: (context) => {
    set((state) => ({ ...state, ...context }));
    
    const currentState = get();
    if (currentState.updateInProgress) return;
    
    // Clear any pending updates
    if (currentState.pendingUpdates) {
      clearTimeout(currentState.pendingUpdates);
    }
    
    // Set up debounced update
    const timeout = setTimeout(async () => {
      const state = get();
      if (state.updateInProgress || !state.userId) return;
      
      set({ updateInProgress: true });
      
      try {
        await supabase
          .from('user_preferences')
          .update({
            last_organization_id: context.organizationId || state.organizationId,
            last_project_id: context.projectId || state.projectId,
            last_budget_id: context.budgetId || state.budgetId,
          })
          .eq('user_id', state.userId);
      } catch (error) {
        console.error('Error updating user preferences:', error);
      } finally {
        set({ updateInProgress: false, pendingUpdates: null });
      }
    }, 500);
    
    set({ pendingUpdates: timeout });
  },

  setOrganizationId: (organizationId: string) => {
    const currentState = get();
    set({ organizationId });
    
    if (!currentState.userId || currentState.updateInProgress) return;
    
    get().setUserContext({ organizationId });
  },

  setProjectId: (projectId: string) => {
    const currentState = get();
    set({ projectId });
    
    if (!currentState.userId || currentState.updateInProgress) return;
    
    get().setUserContext({ projectId });
  },

  setBudgetId: (budgetId: string) => {
    const currentState = get();
    set({ budgetId });
    
    if (!currentState.userId || currentState.updateInProgress) return;
    
    get().setUserContext({ budgetId });
  },

  clearUserContext: () => {
    set({
      organizationId: null,
      projectId: null,
      budgetId: null,
      planId: null,
      userId: null,
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
    const currentState = get();
    if (currentState.isInitialized || currentState.isLoading) return;
    
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
        
        // Check for existing preferences again to avoid race conditions
        const { data: existingPrefs } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', dbUser.id)
          .maybeSingle();

        if (existingPrefs) {
          console.log('Preferencias encontradas en segunda verificación:', existingPrefs);
          set({
            organizationId: existingPrefs.last_organization_id,
            projectId: existingPrefs.last_project_id,
            budgetId: existingPrefs.last_budget_id,
            planId: null,
            userId: dbUser.id,
            isLoading: false,
            isInitialized: true,
          });
          return;
        }
        
        // Only create if absolutely no preferences exist
        const { data: orgMembership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', dbUser.id)
          .limit(1)
          .maybeSingle();

        if (orgMembership?.organization_id) {
          console.log('Intentando crear preferencias por defecto con organización:', orgMembership.organization_id);
          
          // Try to insert, but handle potential duplicates gracefully
          const { data: newPrefs, error: createError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: dbUser.id,
              last_organization_id: orgMembership.organization_id,
            })
            .select()
            .maybeSingle();

          if (createError) {
            console.log('No se pudo crear preferencias (posiblemente ya existen):', createError.message);
            
            // Try one more time to fetch existing preferences
            const { data: finalCheck } = await supabase
              .from('user_preferences')
              .select('*')
              .eq('user_id', dbUser.id)
              .limit(1)
              .maybeSingle();

            if (finalCheck) {
              console.log('Usando preferencias existentes encontradas:', finalCheck);
              set({
                organizationId: finalCheck.last_organization_id,
                projectId: finalCheck.last_project_id,
                budgetId: finalCheck.last_budget_id,
                planId: null,
                userId: dbUser.id,
                isLoading: false,
                isInitialized: true,
              });
              return;
            }

            // If still no preferences, continue with basic setup
            set({
              organizationId: orgMembership.organization_id,
              userId: dbUser.id,
              isLoading: false,
              isInitialized: true,
            });
            return;
          }

          if (newPrefs) {
            console.log('Preferencias creadas exitosamente:', newPrefs);
            
            set({
              organizationId: newPrefs.last_organization_id,
              projectId: newPrefs.last_project_id,
              budgetId: newPrefs.last_budget_id,
              planId: null,
              userId: dbUser.id,
              isLoading: false,
              isInitialized: true,
            });

            console.log('User context initialized successfully');
            return;
          }
        }
        
        console.log('No se encontró membresía de organización para el usuario');
        set({ userId: dbUser.id, isLoading: false, isInitialized: true });
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
        userId: dbUser.id,
        preferences: prefs,
        isLoading: false,
        isInitialized: true,
      });

      console.log('User context initialized successfully');

    } catch (error) {
      console.error('Error initializing user context:', error);
      set({ 
        organizationId: null,
        projectId: null,
        budgetId: null,
        planId: null,
        userId: null,
        preferences: null,
        isLoading: false, 
        isInitialized: true 
      });
    }
  },

  // Update preferences
  updatePreferences: async (updates: Partial<UserPreferences>) => {
    const state = get();
    if (!state.userId) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', state.userId)
        .select()
        .single();

      if (error) throw error;

      set({ preferences: data });
      console.log('Preferences updated successfully:', data);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },
}));