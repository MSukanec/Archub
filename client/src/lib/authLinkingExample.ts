/**
 * EJEMPLO DE USO: handleAuthLinking
 * 
 * Este archivo muestra cómo usar la función handleAuthLinking para vincular
 * usuarios de Supabase Auth con el sistema interno de usuarios.
 */

import { handleAuthLinking, getInternalUserByAuthId } from './authLinkingService';
import { supabase } from './supabase';

/**
 * Ejemplo 1: Uso básico después del login
 */
export async function exampleBasicUsage() {
  // Obtener el usuario autenticado actual
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('No hay usuario autenticado');
    return;
  }

  try {
    // Vincular el usuario de auth con el sistema interno
    const internalUserId = await handleAuthLinking(user);
    
    console.log('Usuario vinculado exitosamente:', internalUserId);
    
    // Ahora puedes usar el internalUserId para operaciones del sistema
    return internalUserId;
    
  } catch (error) {
    console.error('Error vinculando usuario:', error);
    throw error;
  }
}

/**
 * Ejemplo 2: Uso en el flujo de registro
 */
export async function exampleSignUpFlow(email: string, password: string, firstName: string, lastName: string) {
  try {
    // 1. Registrar usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error || !data.user) {
      throw error || new Error('Error en el registro');
    }

    // 2. Vincular automáticamente con el sistema interno
    const internalUserId = await handleAuthLinking(data.user);
    
    console.log('Usuario registrado y vinculado:', {
      authId: data.user.id,
      internalUserId: internalUserId
    });

    return { authUser: data.user, internalUserId };

  } catch (error) {
    console.error('Error en el flujo de registro:', error);
    throw error;
  }
}

/**
 * Ejemplo 3: Obtener datos del usuario interno por auth_id
 */
export async function exampleGetInternalUser() {
  try {
    // Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    // Obtener datos completos del usuario interno
    const internalUser = await getInternalUserByAuthId(user.id);
    
    if (internalUser) {
      console.log('Datos del usuario interno:', {
        id: internalUser.id,
        email: internalUser.email,
        fullName: internalUser.full_name,
        role: internalUser.role,
        planId: internalUser.plan_id
      });
      
      return internalUser;
    } else {
      console.log('Usuario no encontrado en el sistema interno');
      return null;
    }

  } catch (error) {
    console.error('Error obteniendo usuario interno:', error);
    throw error;
  }
}

/**
 * Ejemplo 4: Uso en el contexto de la aplicación
 */
export async function exampleAppContextUsage() {
  try {
    // Este sería el flujo típico al inicializar la app
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Asegurar que el usuario está vinculado
      const internalUserId = await handleAuthLinking(user);
      
      // Obtener datos completos para el contexto de la app
      const internalUser = await getInternalUserByAuthId(user.id);
      
      if (internalUser) {
        // Actualizar contexto de usuario con datos internos
        console.log('Contexto de usuario actualizado:', {
          authId: user.id,
          internalId: internalUser.id,
          email: internalUser.email,
          role: internalUser.role,
          plan: internalUser.plan_id
        });
        
        return {
          auth: user,
          internal: internalUser
        };
      }
    }
    
    return null;

  } catch (error) {
    console.error('Error en contexto de aplicación:', error);
    throw error;
  }
}

/**
 * Ejemplo 5: Manejo de diferentes proveedores (Google, GitHub, etc.)
 */
export async function exampleDifferentProviders() {
  // El sistema maneja automáticamente diferentes proveedores
  // basándose en los metadatos del usuario de Supabase Auth
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // La función detecta automáticamente el proveedor:
    // - user.app_metadata.provider (Google, GitHub, etc.)
    // - user.user_metadata.provider
    // - Fallback a 'email' si no se especifica
    
    const internalUserId = await handleAuthLinking(user);
    
    console.log('Usuario vinculado independientemente del proveedor:', {
      authId: user.id,
      provider: user.app_metadata?.provider || 'email',
      internalUserId
    });
    
    return internalUserId;
  }
}

/**
 * NOTAS DE IMPLEMENTACIÓN:
 * 
 * 1. La función handleAuthLinking es idempotente - puedes llamarla múltiples veces
 *    con el mismo usuario sin causar problemas.
 * 
 * 2. Si un usuario ya existe con el mismo email, se reutiliza ese usuario interno
 *    en lugar de crear uno duplicado.
 * 
 * 3. La tabla linked_accounts mantiene la relación entre auth_id y user_id interno.
 * 
 * 4. El sistema soporta múltiples proveedores de autenticación automáticamente.
 * 
 * 5. Los errores se manejan apropiadamente y se propagan para manejo en la UI.
 */