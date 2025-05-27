import { supabase } from './supabase';

export interface UserPreference {
  id: string;
  user_id: string;
  last_project_id: string | null;
  last_organization_id: string | null;
  last_budget_id: string | null;
}

export const userPreferencesService = {
  async getUserPreferences(authUserId: string): Promise<UserPreference | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', authUserId)
        .single();
      
      if (error) {
        // If no rows found, that's normal for new users
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching user preferences:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('User preferences not available:', error);
      return null;
    }
  },

  async updateLastProject(authUserId: string, projectId: string): Promise<void> {
    try {
      // First try to update existing preferences
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', authUserId)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('user_preferences')
          .update({ last_project_id: projectId })
          .eq('user_id', authUserId);
        
        if (error) {
          console.error('Error updating user preferences:', error);
          throw error;
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: authUserId,
            last_project_id: projectId,
            last_organization_id: null,
            last_budget_id: null
          });
        
        if (error) {
          console.error('Error creating user preferences:', error);
          throw error;
        }
      }
    } catch (error: any) {
      // If foreign key constraint error, just log and continue
      if (error?.code === '23503') {
        console.warn('User preferences skipped - user not found in database');
        return;
      }
      console.error('Error saving last project:', error);
    }
  },

  async getLastProjectId(userId: string): Promise<string | null> {
    const preferences = await this.getUserPreferences(userId);
    return preferences?.last_project_id || null;
  }
};