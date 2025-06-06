import { supabase } from './supabase';
import { useUserContextStore } from '../stores/userContextStore';

export interface Organization {
  id: number;
  name: string;
  slug: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  owner_id: number;
}

export interface CreateOrganizationData {
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
  owner_id: string;
}

export const organizationsService = {
  async getCurrentUserOrganization(): Promise<Organization | null> {
    try {
      // Use centralized context instead of making redundant queries
      const { organization, organizationId } = useUserContextStore.getState();
      
      // If we have cached organization data, return it
      if (organization && organizationId) {
        return organization;
      }
      
      // If no organization context, return null
      if (!organizationId) {
        return null;
      }

      // Fetch organization data if we have ID but no cached data
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      
      if (error || !data) {
        console.log('Error fetching organization:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user organization:', error);
      return null;
    }
  },

  async getAll(): Promise<Organization[]> {
    try {
      // Try using RPC function first to avoid RLS recursion
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_organizations_for_admin');
      
      if (!rpcError && rpcData) {
        return rpcData.map(org => ({
          ...org,
          owner_name: 'Sistema'
        }));
      }
      
      // Fallback to direct query
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching organizations:', error);
        throw new Error(error.message);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAll organizations:', error);
      throw error;
    }
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