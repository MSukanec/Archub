import { supabase } from './supabase';

export interface MaterialCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface CreateMaterialCategoryData {
  name: string;
}

export const materialCategoriesService = {
  async getAll(): Promise<MaterialCategory[]> {
    const { data, error } = await supabase
      .from('material_categories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching material categories:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async create(categoryData: CreateMaterialCategoryData): Promise<MaterialCategory> {
    const { data, error } = await supabase
      .from('material_categories')
      .insert([{
        name: categoryData.name,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating material category:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async update(id: string, categoryData: Partial<CreateMaterialCategoryData>): Promise<MaterialCategory> {
    const { data, error } = await supabase
      .from('material_categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating material category:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('material_categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting material category:', error);
      throw new Error(error.message);
    }
  }
};