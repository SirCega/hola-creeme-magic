
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  address?: string;
  phone?: string;
  last_login?: string;
  created_at?: string;
}

export interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerClient: (userData: { email: string, password: string, name: string, address: string }) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  isLoading: boolean;
  hasAccess: (allowedRoles: string[]) => boolean;
}
