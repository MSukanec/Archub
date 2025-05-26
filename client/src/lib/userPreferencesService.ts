import { supabase } from './supabase';

export interface UserPreference {
  id: string;
  user_id: string;
  last_project_id: string | null;
  last_organization_id: string | null;
  last_budget_id: string | null;
}

export const userPreferencesService = {
  async getUserPreferences(userId: string): Promise<UserPreference | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
    
    return data;
  },

  async updateLastProject(userId: string, projectId: string): Promise<void> {
    // First try to update existing preferences
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
      }
    } else {
      // Create new record
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          last_project_id: projectId,
          last_organization_id: null,
          last_budget_id: null
        });
      
      if (error) {
        console.error('Error creating user preferences:', error);
        throw error;
      }
    }
  },

  async getLastProjectId(userId: string): Promise<string | null> {
    const preferences = await this.getUserPreferences(userId);
    return preferences?.last_project_id || null;
  }
};