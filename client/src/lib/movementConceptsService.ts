import { supabase } from './supabase';

export interface MovementConcept {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export const movementConceptsService = {
  // Get all types (parent_id IS NULL)
  async getTypes(): Promise<MovementConcept[]> {
    try {
      console.log('Fetching movement types...');
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .is('parent_id', null)
        .order('name');
      
      if (error) {
        console.error('Error fetching movement types:', error);
        throw error;
      }
      
      console.log('Movement types fetched:', data);
      return data || [];
    } catch (error) {
      console.error('Error in getTypes:', error);
      throw error;
    }
  },

  // Get categories for a specific type (parent_id = typeId)
  async getCategoriesByType(typeId: string): Promise<MovementConcept[]> {
    try {
      console.log('Fetching categories for type:', typeId);
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .eq('parent_id', typeId)
        .order('name');
      
      if (error) {
        console.error('Error fetching movement categories:', error);
        throw error;
      }
      
      console.log('Movement categories fetched:', data);
      return data || [];
    } catch (error) {
      console.error('Error in getCategoriesByType:', error);
      throw error;
    }
  },

  // Get all concepts (for lookups)
  async getAll(): Promise<MovementConcept[]> {
    const { data, error } = await supabase
      .from('movement_concepts')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Get concept by ID
  async getById(id: string): Promise<MovementConcept | null> {
    const { data, error } = await supabase
      .from('movement_concepts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as MovementConcept;
  }
};