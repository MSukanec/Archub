import { supabase } from './supabase';

export interface ContactType {
  id: string;
  name: string;
}

export interface ContactTypeLink {
  id: string;
  contact_id: string;
  type_id: string;
  contact_types?: ContactType;
}

export const contactTypesService = {
  async getAll(): Promise<ContactType[]> {
    try {
      const { data, error } = await supabase
        .from('contact_types')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching contact types:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Network error fetching contact types:', error);
      return [];
    }
  },

  async getContactTypes(contactId: string): Promise<ContactType[]> {
    try {
      const { data, error } = await supabase
        .from('contact_type_links')
        .select(`
          type_id,
          contact_types!inner (
            id,
            name
          )
        `)
        .eq('contact_id', contactId);
      
      if (error) {
        console.error('Error fetching contact types for contact:', error);
        return [];
      }
      
      return data?.map(link => ({
        id: link.contact_types.id,
        name: link.contact_types.name
      })) || [];
    } catch (error) {
      console.error('Network error fetching contact types for contact:', error);
      return [];
    }
  },

  async updateContactTypes(contactId: string, typeIds: string[]): Promise<void> {
    try {
      // First, delete existing links for this contact
      const { error: deleteError } = await supabase
        .from('contact_type_links')
        .delete()
        .eq('contact_id', contactId);

      if (deleteError) {
        console.error('Error deleting existing contact type links:', deleteError);
        throw new Error('Error al actualizar los tipos de contacto');
      }

      // Then, create new links if there are any types selected
      if (typeIds.length > 0) {
        const newLinks = typeIds.map(typeId => ({
          contact_id: contactId,
          type_id: typeId
        }));

        const { error: insertError } = await supabase
          .from('contact_type_links')
          .insert(newLinks);

        if (insertError) {
          console.error('Error creating new contact type links:', insertError);
          throw new Error('Error al actualizar los tipos de contacto');
        }
      }
    } catch (error) {
      console.error('Error updating contact types:', error);
      throw error;
    }
  }
};