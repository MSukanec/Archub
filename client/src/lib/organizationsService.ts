import { supabase } from './supabase';

export interface Organization {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  owner_id: number;
}

export interface CreateOrganizationData {
  name: string;
  description?: string;
  owner_id: number;
}

export const organizationsService = {
  async getAll(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching organizations:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async create(orgData: CreateOrganizationData): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .insert(orgData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating organization:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async update(id: number, orgData: Partial<CreateOrganizationData>): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update(orgData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating organization:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting organization:', error);
      throw new Error(error.message);
    }
  }
};