import { supabase } from './supabase';

export interface Material {
  id: string;
  name: string;
  unit_id: string;
  created_at: string;
  // Join with units table
  unit?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface CreateMaterialData {
  name: string;
  unit_id: string;
}

export const materialsService = {
  async getAll(): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        unit:units!unit_id (
          id,
          name,
          description
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching materials:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async create(materialData: CreateMaterialData): Promise<Material> {
    const { data, error } = await supabase
      .from('materials')
      .insert([{
        name: materialData.name,
        unit_id: materialData.unit_id,
      }])
      .select(`
        *,
        unit:units!unit_id (
          id,
          name,
          description
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating material:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async update(id: string, materialData: Partial<CreateMaterialData>): Promise<Material> {
    const { data, error } = await supabase
      .from('materials')
      .update(materialData)
      .eq('id', id)
      .select(`
        *,
        unit:units!unit_id (
          id,
          name,
          description
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating material:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting material:', error);
      throw new Error(error.message);
    }
  }
};