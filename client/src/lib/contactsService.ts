import { supabase } from './supabase';

export interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  location: string | null;
  notes: string | null;
  contact_type: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactData {
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  location?: string;
  notes?: string;
  contact_type: string;
}

export const contactsService = {
  async getAll(): Promise<Contact[]> {
    try {
      // Get organization from existing projects (same strategy as create)
      const { data: projectData } = await supabase
        .from('projects')
        .select('organization_id')
        .limit(1)
        .single();

      if (!projectData) {
        return []; // Return empty if no organization found
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', projectData.organization_id) // Filter by organization
        .order('created_at', { ascending: false })
        .limit(100); // Limitar resultados para evitar sobrecarga
      
      if (error) {
        console.error('Error fetching contacts:', error);
        throw new Error('Error al obtener los contactos');
      }
      
      return data || [];
    } catch (error) {
      console.error('Network error fetching contacts:', error);
      return []; // Retornar array vacío en caso de error de red
    }
  },

  async create(contactData: CreateContactData): Promise<Contact> {
    // Get current user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Get organization from existing projects (since projects are working)
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('organization_id')
      .limit(1)
      .single();

    if (projectError || !projectData) {
      throw new Error('No se pudo obtener la organización. Contacta al administrador.');
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        ...contactData,
        organization_id: projectData.organization_id
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating contact:', error);
      throw new Error('Error al crear el contacto');
    }
    
    return data;
  },

  async update(id: number, contactData: Partial<CreateContactData>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update(contactData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating contact:', error);
      throw new Error('Error al actualizar el contacto');
    }
    
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting contact:', error);
      throw new Error('Error al eliminar el contacto');
    }
  },

  async getByType(contactType: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('contact_type', contactType)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching contacts by type:', error);
      throw new Error('Error al obtener los contactos por tipo');
    }
    
    return data || [];
  }
};