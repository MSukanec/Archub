import { supabase } from './supabase';

export interface Element {
  id: number;
  name: string;
}

export interface CreateElementData {
  name: string;
}

export const elementsService = {
  async getAll(): Promise<Element[]> {
    const { data, error } = await supabase
      .from('task_elements')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      console.error('Error fetching elements:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async create(elementData: CreateElementData): Promise<Element> {
    const { data, error } = await supabase
      .from('task_elements')
      .insert([{
        name: elementData.name,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating element:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async update(id: number, elementData: Partial<CreateElementData>): Promise<Element> {
    const { data, error } = await supabase
      .from('task_elements')
      .update(elementData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating element:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('task_elements')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting element:', error);
      throw new Error(error.message);
    }
  }
};