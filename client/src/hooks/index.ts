import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Extension, 
  Trunk, 
  Call, 
  Channel, 
  SystemMetrics,
  DashboardStats,
  CDRRecord,
  ApiResponse 
} from '@/types';

// Generic fetcher for SWR
const fetcher = async <T>(url: string): Promise<T> => {
  const response = await apiClient.get(url);
  if (response.success && response.data) {
    return response.data as T;
  }
  throw new Error(response.error || 'Failed to fetch data');
};

// User management hooks
export function useUsers(params?: { page?: number; limit?: number; search?: string }) {
  const queryParams = new URLSearchParams(params as any).toString();
  const url = `/users${queryParams ? `?${queryParams}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR<User[]>(
    `users:${url}`,
    () => fetcher<User[]>(url)
  );

  return {
    users: data || [],
    pagination: undefined,
    isLoading,
    error,
    mutate,
  };
}

export function useUser(id: string) {
  const { data, error, isLoading, mutate } = useSWR<User>(
    `user:${id}`,
    () => fetcher<User>(`/users/${id}`)
  );

  return {
    user: data,
    isLoading,
    error,
    mutate,
  };
}

export function useCreateUser() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (userData: Partial<User>) => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await apiClient.createUser(userData);
      if (response.success) {
        // Invalidate users cache
        mutate('users:*');
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to create user');
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create user');
      return { success: false, error: error.message };
    } finally {
      setIsCreating(false);
    }
  };

  return { createUser, isCreating, error };
}

export function useUpdateUser() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = async (id: string, userData: Partial<User>) => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await apiClient.updateUser(id, userData);
      if (response.success) {
        // Invalidate caches
        mutate(`user:${id}`);
        mutate('users:*');
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to update user');
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update user');
      return { success: false, error: error.message };
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateUser, isUpdating, error };
}

export function useDeleteUser() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteUser = async (id: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await apiClient.deleteUser(id);
      if (response.success) {
        // Invalidate caches
        mutate(`user:${id}`);
        mutate('users:*');
        return { success: true };
      } else {
        setError(response.error || 'Failed to delete user');
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete user');
      return { success: false, error: error.message };
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteUser, isDeleting, error };
}

// Extension management hooks
export function useExtensions(params?: { page?: number; limit?: number; userId?: string; search?: string }) {
  const queryParams = new URLSearchParams(params as any).toString();
  const url = `/extensions${queryParams ? `?${queryParams}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR<Extension[]>(
    `extensions:${url}`,
    () => fetcher<Extension[]>(url)
  );

  return {
    extensions: data || [],
    pagination: undefined,
    isLoading,
    error,
    mutate,
  };
}

export function useExtension(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Extension>(
    `extension:${id}`,
    () => fetcher<Extension>(`/extensions/${id}`)
  );

  return {
    extension: data,
    isLoading,
    error,
    mutate,
  };
}

export function useCreateExtension() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExtension = async (extensionData: Partial<Extension>) => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await apiClient.createExtension(extensionData);
      if (response.success) {
        // Invalidate extensions cache
        mutate('extensions:*');
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to create extension');
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create extension');
      return { success: false, error: error.message };
    } finally {
      setIsCreating(false);
    }
  };

  return { createExtension, isCreating, error };
}

export function useUpdateExtension() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateExtension = async (id: string, extensionData: Partial<Extension>) => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await apiClient.updateExtension(id, extensionData);
      if (response.success) {
        // Invalidate caches
        mutate(`extension:${id}`);
        mutate('extensions:*');
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to update extension');
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update extension');
      return { success: false, error: error.message };
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateExtension, isUpdating, error };
}

export function useDeleteExtension() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteExtension = async (id: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await apiClient.deleteExtension(id);
      if (response.success) {
        // Invalidate caches
        mutate(`extension:${id}`);
        mutate('extensions:*');
        return { success: true };
      } else {
        setError(response.error || 'Failed to delete extension');
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete extension');
      return { success: false, error: error.message };
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteExtension, isDeleting, error };
}

// Trunk management hooks
export function useTrunks() {
  const { data, error, isLoading, mutate } = useSWR<Trunk[]>(
    'trunks',
    () => fetcher<Trunk[]>('/trunks')
  );

  return {
    trunks: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useTrunk(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Trunk>(
    `trunk:${id}`,
    () => fetcher<Trunk>(`/trunks/${id}`)
  );

  return {
    trunk: data,
    isLoading,
    error,
    mutate,
  };
}

// Monitoring hooks
export function useSystemStatus() {
  const { data, error, isLoading, mutate } = useSWR<SystemMetrics>(
    'system-status',
    () => fetcher<SystemMetrics>('/monitoring/status'),
    {
      refreshInterval: 5000, // Refresh every 5 seconds
    }
  );

  return {
    systemMetrics: data,
    isLoading,
    error,
    mutate,
  };
}

export function useActiveCalls() {
  const { data, error, isLoading, mutate } = useSWR<Call[]>(
    'active-calls',
    () => fetcher<Call[]>('/monitoring/calls'),
    {
      refreshInterval: 1000, // Refresh every second
    }
  );

  return {
    activeCalls: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useActiveChannels() {
  const { data, error, isLoading, mutate } = useSWR<Channel[]>(
    'active-channels',
    () => fetcher<Channel[]>('/monitoring/channels'),
    {
      refreshInterval: 1000, // Refresh every second
    }
  );

  return {
    activeChannels: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    'dashboard-stats',
    () => fetcher<DashboardStats>('/monitoring/dashboard'),
    {
      refreshInterval: 10000, // Refresh every 10 seconds
    }
  );

  return {
    dashboardStats: data,
    isLoading,
    error,
    mutate,
  };
}

// CDR hooks
export function useCDRs(params?: { 
  page?: number; 
  limit?: number; 
  startDate?: string; 
  endDate?: string; 
  source?: string; 
  destination?: string; 
}) {
  const queryParams = new URLSearchParams(params as any).toString();
  const url = `/cdr${queryParams ? `?${queryParams}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR<CDRRecord[]>(
    `cdrs:${url}`,
    () => fetcher<CDRRecord[]>(url)
  );

  return {
    cdrs: data || [],
    pagination: {
      page: 1,
      limit: 25,
      total: data?.length || 0,
      totalPages: 1,
    },
    isLoading,
    error,
    mutate,
  };
}

// Utility hooks
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    try {
      const newSocket = apiClient.createWebSocket();
      
      newSocket.onopen = () => {
        setConnected(true);
        setSocket(newSocket);
      };

      newSocket.onclose = () => {
        setConnected(false);
        setSocket(null);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (isAuthenticated) {
            // Trigger reconnection by updating state
            setSocket(null);
          }
        }, 5000);
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [isAuthenticated, token]);

  return { socket, connected };
}