import { useAuthStore } from '../stores/authStore';
import type { User, LoginCredentials, SignUpData } from '../types/auth';

/**
 * Custom hook for authentication functionality
 * Provides access to auth state and actions with proper error handling
 */
export const useAuth = () => {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    signup,
    logout,
    updateProfile,
    refreshUser,
    initialize,
    clearError,
  } = useAuthStore();

  /**
   * Check if the current user has a specific role
   */
  const hasRole = (role: 'learner' | 'admin'): boolean => {
    return user?.role === role;
  };

  /**
   * Check if the current user is an admin
   */
  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  /**
   * Check if the current user is a learner
   */
  const isLearner = (): boolean => {
    return user?.role === 'learner';
  };

  /**
   * Login wrapper with enhanced error handling
   */
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      clearError();
      return await login(credentials);
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  /**
   * Signup wrapper with enhanced error handling
   */
  const handleSignup = async (data: SignUpData) => {
    try {
      clearError();
      return await signup(data);
    } catch (error) {
      console.error('Signup failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Signup failed' 
      };
    }
  };

  /**
   * Logout wrapper with enhanced error handling
   */
  const handleLogout = async () => {
    try {
      clearError();
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /**
   * Update profile wrapper with enhanced error handling
   */
  const handleUpdateProfile = async (updates: Partial<User>) => {
    try {
      clearError();
      return await updateProfile(updates);
    } catch (error) {
      console.error('Profile update failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Profile update failed' 
      };
    }
  };

  /**
   * Get user display name with fallback
   */
  const getDisplayName = (): string => {
    if (!user) return '';
    return user.displayName || user.email.split('@')[0] || 'User';
  };

  /**
   * Get user initials for avatars
   */
  const getUserInitials = (): string => {
    if (!user) return '';
    
    if (user.displayName) {
      const names = user.displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    
    return user.email.substring(0, 2).toUpperCase();
  };

  /**
   * Check if user session is still valid
   */
  const isSessionValid = (): boolean => {
    return isAuthenticated && user !== null;
  };

  /**
   * Format last active time
   */
  const getLastActiveFormatted = (): string => {
    if (!user?.lastActive) return 'Never';
    
    const lastActive = new Date(user.lastActive);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return lastActive.toLocaleDateString();
  };

  return {
    // State
    user,
    isLoading,
    isAuthenticated,
    error,
    
    // Actions
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    refreshUser,
    initialize,
    clearError,
    
    // Utilities
    hasRole,
    isAdmin,
    isLearner,
    getDisplayName,
    getUserInitials,
    isSessionValid,
    getLastActiveFormatted,
  };
};

export default useAuth;