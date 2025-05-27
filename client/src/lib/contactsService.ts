import { supabase } from './supabase';
import { useUserContextStore } from '@/stores/userContextStore';

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
      // Use centralized context instead of making redundant queries
      const { organizationId } = useUserContextStore.getState();
      
      if (!organizationId) {
        console.log('No organization context, returning empty contacts');
        return [];
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching contacts:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Network error fetching contacts:', error);
      return [];
    }
  },

  async create(contactData: CreateContactData): Promise<Contact> {
    // Use centralized context instead of multiple queries
    const { organizationId } = useUserContextStore.getState();
    
    if (!organizationId) {
      throw new Error('No se pudo obtener la organización del usuario');
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        ...contactData,
        organization_id: organizationId
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