// Script temporal para debuggear el rol del usuario
import { supabase } from './client/src/lib/supabase.js';

async function debugUserRole() {
  try {
    // Obtener el usuario autenticado actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error getting auth user:', authError);
      return;
    }
    
    console.log('Auth User ID:', user?.id);
    console.log('Auth User Email:', user?.email);
    
    // Consultar la tabla users con el auth_id del usuario autenticado
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user?.id);
    
    console.log('User Data from DB:', userData);
    console.log('User Error:', userError);
    
    // Intentar consultar todos los usuarios (esto fallará si RLS está bloqueando)
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*');
    
    console.log('All Users:', allUsers);
    console.log('All Users Error:', allUsersError);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugUserRole();