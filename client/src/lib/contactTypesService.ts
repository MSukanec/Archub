import { supabase } from './supabase';

export interface ContactType {
  id: string;
  name: string;
}

export interface ContactTypeLink {
  id: string;
  contact_id: string;
  type_id: string;
}

export const contactTypesService = {
  // Obtener todos los tipos de contacto
  async getContactTypes(): Promise<ContactType[]> {
    const { data, error } = await supabase
      .from('contact_types')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Obtener tipos de contacto de un contacto específico
  async getContactTypesByContactId(contactId: string): Promise<ContactType[]> {
    const { data, error } = await supabase
      .from('contact_type_links')
      .select(`
        type_id,
        contact_types (
          id,
          name
        )
      `)
      .eq('contact_id', contactId);
    
    if (error) throw error;
    return data?.map(link => ({
      id: (link.contact_types as any).id,
      name: (link.contact_types as any).name
    })) || [];
  },

  // Actualizar tipos de contacto para un contacto
  async updateContactTypes(contactId: string, typeIds: string[]): Promise<void> {
    // Primero eliminar todos los tipos existentes
    const { error: deleteError } = await supabase
      .from('contact_type_links')
      .delete()
      .eq('contact_id', contactId);
    
    if (deleteError) throw deleteError;

    // Luego insertar los nuevos tipos
    if (typeIds.length > 0) {
      const links = typeIds.map(typeId => ({
        contact_id: contactId,
        type_id: typeId
      }));

      const { error: insertError } = await supabase
        .from('contact_type_links')
        .insert(links);
      
      if (insertError) throw insertError;
    }
  }
};