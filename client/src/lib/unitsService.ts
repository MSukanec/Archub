import { supabase } from './supabase';

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateUnitData {
  name: string;
  symbol: string;
  type: string;
  is_active?: boolean;
}

export const unitsService = {
  async getAll(): Promise<Unit[]> {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('created_at', { ascending: false });
    
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
        symbol: unitData.symbol,
        type: unitData.type,
        is_active: unitData.is_active ?? true,
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