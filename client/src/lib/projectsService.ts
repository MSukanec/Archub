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
    console.log('Fetching all projects...');
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw new Error('Error al obtener los proyectos');
    }
    
    console.log('Projects fetched:', data);
    return data || [];
  },

  async create(projectData: CreateProjectData): Promise<Project> {
    // Get current user to use as organization_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

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
        organization_id: user.id, // Use user's auth ID as organization_id
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