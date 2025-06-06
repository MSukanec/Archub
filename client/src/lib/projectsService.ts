import { supabase } from './supabase';
import { useUserContextStore } from '../../stores/userContextStore';

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
  email: string | null;
  city: string | null;
  zip_code: string | null;
  organization_id: string | null;
  is_active: boolean;
  lat: number | null;
  lng: number | null;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  client_name?: string;
  status?: string;
  address?: string;
  contact_phone?: string;
  email?: string;
  city?: string;
  zip_code?: string;
  organization_id?: number;
  lat?: number | null;
  lng?: number | null;
}

export const projectsService = {
  async getAll(): Promise<Project[]> {
    console.log('Fetching projects for current user organization...');
    
    // Use centralized context instead of multiple queries
    const { organizationId, currentProjects, isInitialized } = useUserContextStore.getState();
    
    console.log('Current context state:', { organizationId, hasProjects: !!currentProjects, isInitialized });
    
    // If we have cached projects and a valid organization, return cached data
    if (organizationId && currentProjects) {
      console.log('Projects fetched for organization:', currentProjects);
      return currentProjects;
    }
    
    // If no organizationId, user might not be part of an organization yet
    if (!organizationId) {
      console.log('User is not part of any organization yet');
      return [];
    }

    // Fetch projects only for user's organization
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw new Error('Error al obtener los proyectos');
    }
    
    console.log('Projects fetched for organization:', data);
    return data || [];
  },

  async create(projectData: CreateProjectData): Promise<Project> {
    // Use centralized context instead of multiple queries
    const { organizationId } = useUserContextStore.getState();
    
    if (!organizationId) {
      throw new Error('No se pudo obtener la organización del usuario');
    }

    console.log('Creating project with data:', projectData);
    console.log('Organization ID:', organizationId);

    const insertData = {
      name: projectData.name,
      description: projectData.description || null,
      client_name: projectData.client_name || null,
      status: projectData.status || 'planning',
      address: projectData.address || null,
      contact_phone: projectData.contact_phone || null,
      email: projectData.email || null,
      city: projectData.city || null,
      zip_code: projectData.zip_code || null,
      lat: projectData.lat || null,
      lng: projectData.lng || null,
      organization_id: organizationId,
      is_active: true,
    };

    console.log('Insert data:', insertData);

    const { data, error } = await supabase
      .from('projects')
      .insert([insertData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating project:', error);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error message:', error.message);
      throw new Error(`Error al crear el proyecto: ${error.message}`);
    }
    
    console.log('Project created successfully:', data);
    
    // Refresh the cached data after creating
    useUserContextStore.getState().refreshData();
    
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
    
    // Refresh the cached data after updating
    useUserContextStore.getState().refreshData();
    
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