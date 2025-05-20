
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, AuthContextType } from '@/types/auth-types';
import * as authService from '@/services/auth.service';
import * as userService from '@/services/user.service';
import * as accessControlService from '@/services/access-control.service';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Setup auth state listener
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        setSession(currentSession);
        setSupabaseUser(currentSession?.user ?? null);
        
        // If there's a user authenticated, get their profile information
        if (currentSession?.user) {
          // Use setTimeout to avoid blocking
          setTimeout(async () => {
            try {
              const userData = await userService.getUserById(currentSession.user.id);
              console.log("User data fetched:", userData);
              if (userData) {
                setUser(userData);
              }
            } catch (error) {
              console.error("Error fetching user data in auth change:", error);
            }
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Then check if there's an existing session
    const checkExistingSession = async () => {
      try {
        console.log("Checking for existing session");
        const { session: currentSession, user: userData } = await authService.getCurrentSession();
        console.log("Existing session check result:", currentSession, userData);
        setSession(currentSession);
        setSupabaseUser(currentSession?.user ?? null);
        setUser(userData);
      } catch (error) {
        console.error("Error checking existing session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Initiating login with:", email);
      // Login with Supabase Auth
      const { user: authUser } = await authService.signInWithEmail(email, password);
      
      if (!authUser) {
        throw new Error("Authentication failed");
      }
      
      console.log("Authentication successful, user:", authUser.id);

      // Get user data
      const userData = await userService.getUserById(authUser.id);
      
      if (!userData) {
        console.error("Could not get user data");
        throw new Error("Error getting user data");
      }

      console.log("User data retrieved:", userData);

      // Update last login
      await userService.updateLastLogin(userData.id);

      toast({
        title: "Bienvenido",
        description: `Hola, ${userData.name}`,
      });
      
      navigate("/dashboard");
      return userData;
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Error de autenticación";
      
      if (error.message && error.message.includes("Invalid login credentials")) {
        errorMessage = "Credenciales inválidas. Verifica tu email y contraseña.";
      } else if (error.message && error.message.includes("Email not confirmed")) {
        errorMessage = "Email no confirmado. Verifica tu bandeja de entrada.";
      }
      
      toast({
        title: "Error de Autenticación",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      
      navigate("/auth");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Error al cerrar sesión",
        description: error.message || "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Register a new client
  const registerClient = async (userData: { email: string, password: string, name: string, address: string }) => {
    setIsLoading(true);
    try {
      console.log("Registering new client:", userData.email);
      await authService.registerClient(userData);
      
      toast({
        title: "Registro exitoso",
        description: `Bienvenido, ${userData.name}`,
      });

      // Login after registration
      await login(userData.email, userData.password);
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "Error de registro";
      if (error.message && error.message.includes("User already registered")) {
        errorMessage = "Este email ya está registrado.";
      }
      
      toast({
        title: "Error de registro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get all users (admin only)
  const getAllUsers = async (): Promise<User[]> => {
    if (!user || user.role !== 'admin') {
      return [];
    }
    return await userService.getAllUsers(user?.role);
  };

  // Check if user has access based on their role
  const hasAccess = (allowedRoles: string[]) => {
    return accessControlService.hasAccess(user, allowedRoles);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      supabaseUser,
      session,
      login, 
      logout, 
      isLoading, 
      hasAccess, 
      registerClient,
      getAllUsers 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { User } from '@/types/auth-types';
