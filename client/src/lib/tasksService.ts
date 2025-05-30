import { supabase } from './supabase';
import type { Task, InsertTask } from '@shared/schema';

export interface CreateTaskData {
  name: string;
  unit_labor_price?: number;
  unit_material_price?: number;
  category_id?: string;
  subcategory_id?: string;
  element_category_id?: string;
  unit_id?: number;
}

export { Task };

export const tasksService = {
  async getAll(): Promise<Task[]> {
    console.log('Fetching all tasks...');
    
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        category:task_categories!category_id(name),
        subcategory:task_categories!subcategory_id(name),
        element_category:task_categories!element_category_id(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw new Error(`Error fetching tasks: ${error.message}`);
    }

    console.log('Tasks fetched:', data);
    return data || [];
  },

  async create(taskData: CreateTaskData): Promise<Task> {
    console.log('Creating task:', taskData);
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw new Error(`Error creating task: ${error.message}`);
    }

    console.log('Task created:', data);
    return data;
  },

  async update(id: number, taskData: Partial<CreateTaskData>): Promise<Task> {
    console.log('Updating task:', id, taskData);
    
    const { data, error } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw new Error(`Error updating task: ${error.message}`);
    }

    console.log('Task updated:', data);
    return data;
  },

  async delete(id: number): Promise<void> {
    console.log('Deleting task:', id);
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      throw new Error(`Error deleting task: ${error.message}`);
    }

    console.log('Task deleted successfully');
  },
};