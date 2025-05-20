
import { useContext } from 'react';
import AuthContext from '@/contexts/AuthContext';
import { AuthContextType } from '@/types/auth-types';

/**
 * Custom hook to access the Auth context
 * @returns The auth context containing user, session and auth methods
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;
