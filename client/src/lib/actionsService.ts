import { supabase } from './supabase';

export interface Action {
  id: number;
  name: string;
  description?: string;
}

export interface CreateActionData {
  name: string;
  description?: string;
}

export const actionsService = {
  async getAll(): Promise<Action[]> {
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      console.error('Error fetching actions:', error);
      throw new Error('Error al obtener las acciones');
    }
    
    return data || [];
  },

  async create(actionData: CreateActionData): Promise<Action> {
    const { data, error } = await supabase
      .from('actions')
      .insert([actionData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating action:', error);
      throw new Error('Error al crear la acción');
    }
    
    return data;
  },

  async update(id: number, actionData: Partial<CreateActionData>): Promise<Action> {
    const { data, error } = await supabase
      .from('actions')
      .update(actionData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating action:', error);
      throw new Error('Error al actualizar la acción');
    }
    
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting action:', error);
      throw new Error('Error al eliminar la acción');
    }
  },
};