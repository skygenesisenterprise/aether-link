'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, AuthState } from '@/types';
import apiClient from '@/lib/api-client';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  hasPermission: (resource: string, action: string) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for development mode first
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment) {
          // Check if we have a dev user in localStorage
          const devUser = localStorage.getItem('devUser');
          if (devUser) {
            const user = JSON.parse(devUser);
            setAuthState({
              user,
              token: 'dev-token',
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            return;
          }
        }
        
        if (apiClient.isAuthenticated()) {
          const user = apiClient.getCurrentUser();
          setAuthState({
            user,
            token: apiClient.getAuthToken(),
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: 'Authentication check failed',
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check for development mode
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        // Simulate successful login in development
        const mockUser = {
          id: 'dev-user-1',
          username: username,
          email: `${username}@aether-link.dev`,
          role: 'admin',
          permissions: [
            { resource: 'users', action: 'read', granted: true },
            { resource: 'users', action: 'write', granted: true },
            { resource: 'extensions', action: 'read', granted: true },
            { resource: 'extensions', action: 'write', granted: true },
            { resource: 'calls', action: 'read', granted: true },
            { resource: 'cdr', action: 'read', granted: true },
            { resource: 'system', action: 'read', granted: true },
            { resource: 'system', action: 'write', granted: true },
          ],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        
        localStorage.setItem('devUser', JSON.stringify(mockUser));
        
        setAuthState({
          user: mockUser,
          token: 'dev-token',
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        return true;
      }
      
      const response = await apiClient.login({ username, password });
      
      if (response.success && response.data) {
        setAuthState({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Login failed',
        }));
        return false;
      }
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Login failed',
      }));
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Check for development mode
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        localStorage.removeItem('devUser');
      } else {
        await apiClient.logout();
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    }

    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await apiClient.refreshToken();
      
      if (response.success && response.data && 'token' in response.data) {
        const token = response.data.token;
        setAuthState(prev => ({
          ...prev,
          token,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!authState.user) return false;
    
    if (authState.user.role === 'admin') return true;
    
    return authState.user.permissions.some(permission => 
      permission.resource === resource && 
      permission.action === action && 
      permission.granted
    );
  };

  const isAdmin = (): boolean => {
    return authState.user?.role === 'admin';
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
    hasPermission,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;