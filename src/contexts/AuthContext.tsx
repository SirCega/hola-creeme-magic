
import React, { createContext } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, AuthContextType } from '@/types/auth-types';

// Create the auth context with a null default value
const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;
