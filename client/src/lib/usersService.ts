import { supabase } from './supabase';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  plan_id: string | null;
  created_at: string;
  auth_id: string;
}

export interface CreateUserData {
  email: string;
  full_name: string;
  role: string;
  plan_id: string;
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('Error al obtener los usuarios');
    }
    
    return data || [];
  },

  async create(userData: CreateUserData): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        plan_id: userData.plan_id,
        auth_id: `temp_${Date.now()}` // Temporal auth_id
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      throw new Error('Error al crear el usuario');
    }
    
    return data;
  },

  async update(id: number, userData: Partial<CreateUserData>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      throw new Error('Error al actualizar el usuario');
    }
    
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user:', error);
      throw new Error('Error al eliminar el usuario');
    }
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
      throw new Error('Error al actualizar el rol del usuario');
    }
    
    return data;
  }
};