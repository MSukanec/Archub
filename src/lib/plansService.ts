import { supabase } from './supabase';

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: any;
  is_active: boolean;
}

export const plansService = {
  async getAll(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (error) {
      console.error('Error fetching plans:', error);
      throw new Error('Error al obtener los planes');
    }
    
    return data || [];
  },
};