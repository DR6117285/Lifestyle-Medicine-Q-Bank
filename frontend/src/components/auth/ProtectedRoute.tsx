import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

interface ProtectedRouteProps {
  /** The component(s) to render when access is granted */
  children: React.ReactNode;
  /** Whether authentication is required (default: true) */
  requireAuth?: boolean;
  /** Specific role required to access the route */
  requiredRole?: 'learner' | 'admin';
  /** Where to redirect if access is denied (default: login page) */
  redirectTo?: string;
  /** Custom loading component to show during authentication check */
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute component that handles authentication and authorization
 * 
 * @param children - The component(s) to render when access is granted
 * @param requireAuth - Whether authentication is required (default: true)
 * @param requiredRole - Specific role required to access the route
 * @param redirectTo - Where to redirect if access is denied (default: login page)
 * @param fallback - Custom loading component
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredRole,
  redirectTo,
  fallback,
}) => {
  const { user, isAuthenticated, isLoading, initialize, hasRole, _isInitializing } = useAuth();
  const location = useLocation();

  // Initialize auth on mount - but only if not already authenticated or initializing
  useEffect(() => {
    if (!isAuthenticated && !isLoading && !_isInitializing) {
      console.log('[PROTECTED_ROUTE] Initializing auth from protected route');
      initialize();
    }
  }, [initialize, isAuthenticated, isLoading, _isInitializing]);

  // Show loading state
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-50"
        role="status"
        aria-label="Loading authentication status"
      >
        <div className="flex flex-col items-center space-y-4">
          <Loader2 
            className="h-8 w-8 animate-spin text-blue-600" 
            aria-hidden="true"
          />
          <p className="text-gray-600 text-sm font-medium">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  // Handle authentication requirement
  if (requireAuth && !isAuthenticated) {
    const destination = redirectTo || ROUTES.LOGIN;
    return (
      <Navigate 
        to={destination} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Handle role-based access control
  if (requireAuth && requiredRole && (!user || !hasRole(requiredRole))) {
    // Redirect based on user's actual role or to login if no user
    if (!user) {
      return (
        <Navigate 
          to={ROUTES.LOGIN} 
          state={{ from: location.pathname }} 
          replace 
        />
      );
    }

    // User is authenticated but doesn't have required role
    if (user.role === 'admin') {
      // Admin trying to access learner route - redirect to admin dashboard
      return <Navigate to={ROUTES.ADMIN} replace />;
    } else {
      // Learner trying to access admin route - redirect to regular dashboard
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
  }

  // Handle inverse authentication (e.g., login page when already authenticated)
  if (!requireAuth && isAuthenticated) {
    const destination = redirectTo || ROUTES.DASHBOARD;
    return <Navigate to={destination} replace />;
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * Higher-order component that wraps a component with protection
 */
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) => {
  const ProtectedComponent: React.FC<P> = (props) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  
  return ProtectedComponent;
};

/**
 * Component for routes that require admin role
 */
export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requiredRole="admin">
    {children}
  </ProtectedRoute>
);

/**
 * Component for routes that require learner role
 */
export const LearnerProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true} requiredRole="learner">
    {children}
  </ProtectedRoute>
);

/**
 * Component for public routes (redirects authenticated users)
 */
export const PublicRoute: React.FC<{ 
  children: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo }) => (
  <ProtectedRoute requireAuth={false} redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;