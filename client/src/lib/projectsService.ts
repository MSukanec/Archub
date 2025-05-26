import { supabase } from './supabase';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  client_name: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  address: string | null;
  contact_phone: string | null;
  city: string | null;
  organization_id: string | null;
  is_active: boolean;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  client_name?: string;
  status?: string;
  address?: string;
  contact_phone?: string;
  city?: string;
  organization_id?: number;
}

export const projectsService = {
  async getAll(): Promise<Project[]> {
    console.log('Fetching projects for current user organization...');
    
    // Get current user and their organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Get user's organization from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();
    
    if (userError || !userData) {
      console.error('Error getting user data:', userError);
      throw new Error('No se pudo obtener los datos del usuario');
    }

    // Get user's organization through organization_members table
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userData.id)
      .single();
    
    if (memberError || !memberData?.organization_id) {
      console.log('User is not part of any organization yet:', memberError);
      // Si el usuario no tiene organización, devolver lista vacía en lugar de mostrar proyectos de otros
      return [];
    }

    console.log('User organization_id:', memberData.organization_id);

    // Fetch projects only for user's organization
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .eq('organization_id', memberData.organization_id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw new Error('Error al obtener los proyectos');
    }
    
    console.log('Projects fetched for organization:', data);
    return data || [];
  },

  async create(projectData: CreateProjectData): Promise<Project> {
    // Get current user and their organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // First, let's check what columns exist in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();
    
    if (userError || !userData) {
      console.error('Error getting user data:', userError);
      console.log('Available user data:', userData);
      throw new Error('No se pudo obtener los datos del usuario');
    }
    
    console.log('Full user data:', userData);
    
    // Check if user has an organization through organization_members table
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userData.id)
      .single();
    
    if (memberError || !memberData?.organization_id) {
      console.error('Error getting user organization membership:', memberError);
      throw new Error('No se pudo obtener la organización del usuario');
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        name: projectData.name,
        description: projectData.description || null,
        client_name: projectData.client_name || null,
        status: projectData.status || 'planning',
        address: projectData.address || null,
        contact_phone: projectData.contact_phone || null,
        city: projectData.city || null,
        organization_id: memberData.organization_id, // Use user's actual organization_id
        is_active: true,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project:', error);
      throw new Error('Error al crear el proyecto');
    }
    
    return data;
  },

  async update(id: string, projectData: Partial<CreateProjectData>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...projectData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating project:', error);
      throw new Error('Error al actualizar el proyecto');
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting project:', error);
      throw new Error('Error al eliminar el proyecto');
    }
  },
};