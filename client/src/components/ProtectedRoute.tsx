'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: {
    resource: string;
    action: string;
  };
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requireAdmin = false 
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, hasPermission, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // In development mode, check for dev user
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasDevUser = isDevelopment && localStorage.getItem('devUser');
    
    if (isDevelopment && hasDevUser) {
      return; // Allow access with dev user
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requireAdmin && !isAdmin()) {
      router.push('/dashboard');
      return;
    }

    if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, loading, router, hasPermission, isAdmin, requiredPermission, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // In development mode, check for dev user
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasDevUser = isDevelopment && localStorage.getItem('devUser');
  
  if (isDevelopment && hasDevUser) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && !isAdmin()) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return null;
  }

  return <>{children}</>;
}