import { supabase } from './supabase';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  plan_id: string | null;
  plan_name?: string; // Para mostrar el nombre del plan
  created_at: string;
  auth_id: string;
}

export interface CreateUserData {
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: string;
  plan_id: string;
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        plans:plan_id (
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('Error al obtener los usuarios');
    }
    
    // Transform data to include plan name
    const usersWithPlanNames = (data || []).map(user => ({
      ...user,
      plan_name: user.plans?.name || null
    }));
    
    return usersWithPlanNames;
  },

  async create(userData: CreateUserData): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        full_name: userData.full_name,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        plan_id: userData.plan_id,
        auth_id: `temp_${Date.now()}` // Temporal auth_id
      }])
      .select(`
        *,
        plans:plan_id (
          name
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      throw new Error('Error al crear el usuario');
    }
    
    // Transform data to include plan name
    const userWithPlanName = {
      ...data,
      plan_name: data.plans?.name || null
    };
    
    return userWithPlanName;
  },

  async update(id: number, userData: Partial<CreateUserData>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select(`
        *,
        plans:plan_id (
          name
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      throw new Error('Error al actualizar el usuario');
    }
    
    // Transform data to include plan name
    const userWithPlanName = {
      ...data,
      plan_name: data.plans?.name || null
    };
    
    return userWithPlanName;
  },

  async delete(id: number): Promise<void> {
    // Primero obtenemos el auth_id del usuario
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('auth_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      throw new Error('Error al obtener los datos del usuario');
    }
    
    // Eliminamos de la tabla users
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting user from table:', deleteError);
      throw new Error('Error al eliminar el usuario de la tabla');
    }
    
    // Eliminamos del sistema de autenticación de Supabase usando la Admin API
    if (userData.auth_id && !userData.auth_id.startsWith('temp_')) {
      try {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userData.auth_id);
        
        if (authDeleteError) {
          console.error('Error deleting user from auth:', authDeleteError);
          // No lanzamos error aquí porque el usuario ya fue eliminado de la tabla
          // Solo registramos el error para debugging
        }
      } catch (authError) {
        console.error('Error calling auth delete:', authError);
        // Tampoco lanzamos error aquí
      }
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