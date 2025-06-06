import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    provider?: string;
    [key: string]: any;
  };
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
}

export interface LinkedAccount {
  id: string;
  user_id: string;
  auth_id: string;
  provider: string;
  created_at: string;
}

export interface InternalUser {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  plan_id: string | null;
  auth_id: string | null;
  created_at: string;
}

/**
 * Handles authentication linking between Supabase Auth and internal user system
 * 
 * @param authUser - Authenticated user from Supabase Auth
 * @returns Internal user_id
 */
export async function handleAuthLinking(authUser: AuthUser): Promise<string> {
  const authId = authUser.id;
  const email = authUser.email;
  const provider = authUser.user_metadata?.provider || 
                  authUser.app_metadata?.provider || 
                  'email';

  if (!authId) {
    throw new Error('Auth ID is required');
  }

  if (!email) {
    throw new Error('Email is required for user linking');
  }

  try {
    // Step 1: Check if linked account already exists
    const { data: existingLink, error: linkError } = await supabase
      .from('linked_accounts')
      .select('user_id')
      .eq('auth_id', authId)
      .single();

    if (linkError && linkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing linked account:', linkError);
      throw new Error('Error checking existing authentication link');
    }

    // If link exists, return the associated user_id
    if (existingLink) {
      return existingLink.user_id;
    }

    // Step 2: Check if user exists by email
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking existing user:', userError);
      throw new Error('Error checking existing user');
    }

    let userId: string;

    if (existingUser) {
      // Step 3a: Use existing user
      userId = existingUser.id;
    } else {
      // Step 3b: Create new user
      const newUserData = {
        email: email,
        full_name: authUser.user_metadata?.full_name || 
                  `${authUser.user_metadata?.first_name || ''} ${authUser.user_metadata?.last_name || ''}`.trim() || 
                  email.split('@')[0],
        first_name: authUser.user_metadata?.first_name || email.split('@')[0],
        last_name: authUser.user_metadata?.last_name || null,
        role: 'user', // Default role
        plan_id: null, // Will be assigned later if needed
        auth_id: authId
      };

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([newUserData])
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating new user:', createError);
        throw new Error('Error creating new user');
      }

      userId = newUser.id;
    }

    // Step 4: Create linked account entry
    const linkData = {
      user_id: userId,
      auth_id: authId,
      provider: provider
    };

    const { error: insertLinkError } = await supabase
      .from('linked_accounts')
      .insert([linkData]);

    if (insertLinkError) {
      console.error('Error creating linked account:', insertLinkError);
      throw new Error('Error creating authentication link');
    }

    return userId;

  } catch (error) {
    console.error('Error in handleAuthLinking:', error);
    throw error;
  }
}

/**
 * Gets internal user data by auth_id
 */
export async function getInternalUserByAuthId(authId: string): Promise<InternalUser | null> {
  try {
    // First get the user_id from linked_accounts
    const { data: linkData, error: linkError } = await supabase
      .from('linked_accounts')
      .select('user_id')
      .eq('auth_id', authId)
      .single();

    if (linkError) {
      if (linkError.code === 'PGRST116') {
        return null; // No linked account found
      }
      throw linkError;
    }

    // Then get the full user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', linkData.user_id)
      .single();

    if (userError) {
      throw userError;
    }

    return userData;

  } catch (error) {
    console.error('Error getting internal user by auth_id:', error);
    return null;
  }
}

/**
 * Updates the auth linking service in the existing auth flow
 */
export const authLinkingService = {
  handleAuthLinking,
  getInternalUserByAuthId,
  
  /**
   * Enhanced version of getUserFromDatabase that uses the linking system
   */
  async getUserFromDatabase(authUserId: string): Promise<{ role: string; full_name: string; user_id: string } | null> {
    try {
      const internalUser = await getInternalUserByAuthId(authUserId);
      
      if (!internalUser) {
        return null;
      }

      return {
        role: internalUser.role,
        full_name: internalUser.full_name || `${internalUser.first_name || ''} ${internalUser.last_name || ''}`.trim(),
        user_id: internalUser.id
      };

    } catch (error) {
      console.error('Error in enhanced getUserFromDatabase:', error);
      
      // Fallback to existing hardcoded logic for admin users
      const adminUsers = ['0f77f1c8-ecdf-4484-89a7-022c53f24d5a'];
      
      if (adminUsers.includes(authUserId)) {
        return { role: 'admin', full_name: 'Lenga', user_id: 'admin-fallback' };
      }
      
      return null;
    }
  }
};