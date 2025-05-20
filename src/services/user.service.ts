
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth-types';

/**
 * Get user profile data from Supabase
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    console.log("Getting user by ID:", userId);
    
    // First try to get profile from users table (more reliable in this application)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error("Error fetching user data from profile:", error);
      
      // Fallback to auth.users metadata
      const { data: authUser, error: authError } = await supabase.auth.getUser(userId);
      
      if (authError || !authUser.user) {
        console.error("Error fetching auth user:", authError);
        return null;
      }
      
      const userData: User = {
        id: authUser.user.id,
        email: authUser.user.email || '',
        name: authUser.user.user_metadata?.name || '',
        role: authUser.user.user_metadata?.role || 'cliente',
        address: authUser.user.user_metadata?.address || ''
      };
      
      return userData;
    }
    
    if (!data) {
      console.log("No user found with ID:", userId);
      return null;
    }

    console.log("User found:", data);
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      address: data.address,
      phone: data.phone,
      last_login: data.last_login,
      created_at: data.created_at
    };
  } catch (error) {
    console.error("Error in getUserById:", error);
    return null;
  }
};

/**
 * Update user's last login timestamp
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
  } catch (error) {
    console.error("Error updating last login:", error);
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (currentUserRole?: string): Promise<User[]> => {
  if (currentUserRole !== 'admin') {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      address: user.address,
      phone: user.phone,
      last_login: user.last_login,
      created_at: user.created_at
    })) || [];
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return [];
  }
};

/**
 * Get all customers (role = 'cliente')
 */
export const getCustomers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'cliente');

    if (error) {
      console.error("Error fetching customers:", error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      address: user.address,
      phone: user.phone,
      last_login: user.last_login,
      created_at: user.created_at
    })) || [];
  } catch (error) {
    console.error("Error in getCustomers:", error);
    return [];
  }
};
