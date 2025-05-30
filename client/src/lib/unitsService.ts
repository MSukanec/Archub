import { supabase } from './supabase';
import { Unit, InsertUnit } from '@shared/schema';

export type CreateUnitData = InsertUnit;

export const unitsService = {
  async getAll(): Promise<Unit[]> {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      console.error('Error fetching units:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async create(unitData: CreateUnitData): Promise<Unit> {
    const { data, error } = await supabase
      .from('units')
      .insert([{
        name: unitData.name,
        description: unitData.description,
        // No incluimos created_at para que use el valor por defecto de la DB
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating unit:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async update(id: string, unitData: Partial<CreateUnitData>): Promise<Unit> {
    const { data, error } = await supabase
      .from('units')
      .update(unitData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating unit:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting unit:', error);
      throw new Error(error.message);
    }
  }
};