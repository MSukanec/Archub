import { supabase } from './supabase';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  auth_id: string;
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async updateRole(id: number, role: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user role:', error);
      throw new Error(error.message);
    }
    
    return data;
  }
};