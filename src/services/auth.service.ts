
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth-types';
import { getUserById } from './user.service';

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  console.log("Attempting to sign in with:", email);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      throw error;
    }

    if (!data || !data.user) {
      console.error("No user data returned from authentication");
      throw new Error("Error de autenticación - No se devolvieron datos de usuario");
    }

    console.log("Sign in successful:", data);
    return data;
  } catch (error) {
    console.error("Sign in service error:", error);
    throw error;
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }

  return true;
};

/**
 * Register a new client user
 */
export const registerClient = async (userData: { 
  email: string, 
  password: string, 
  name: string, 
  address: string 
}) => {
  console.log("Registering client:", userData.email);
  try {
    // Register user in Auth
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: 'cliente',
          address: userData.address
        }
      }
    });

    if (error) {
      console.error("Registration error:", error);
      throw error;
    }

    if (!data.user) {
      throw new Error("Error creating user");
    }

    console.log("User registered in auth:", data.user.id);

    // Create user profile (without storing the password)
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: userData.email,
        name: userData.name,
        role: 'cliente',
        address: userData.address,
        password: '' // Add an empty password field to satisfy the schema requirement
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw new Error(`Error creating profile: ${profileError.message}`);
    }

    console.log("User profile created");
    return data;
  } catch (error) {
    console.error("Registration service error:", error);
    throw error;
  }
};

/**
 * Get current session and user data
 */
export const getCurrentSession = async () => {
  console.log("Getting current session");
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return { session: null, user: null };
    }
    
    if (!data.session) {
      console.log("No active session found");
      return { session: null, user: null };
    }
    
    console.log("Session found, user ID:", data.session.user.id);
    try {
      const userData = await getUserById(data.session.user.id);
      console.log("User data retrieved:", userData);
      return {
        session: data.session,
        user: userData
      };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return {
        session: data.session,
        user: null
      };
    }
  } catch (error) {
    console.error("Error getting current session:", error);
    return { session: null, user: null };
  }
};
