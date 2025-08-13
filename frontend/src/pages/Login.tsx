import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';

type AuthMode = 'login' | 'signup';

/**
 * Login page that handles both login and signup functionality
 * Automatically redirects authenticated users to their dashboard
 */
export const Login: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state
  const from = location.state?.from || ROUTES.DASHBOARD;

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = user.role === 'admin' ? ROUTES.ADMIN : from;
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleLoginSuccess = () => {
    const destination = user?.role === 'admin' ? ROUTES.ADMIN : from;
    navigate(destination, { replace: true });
  };

  const handleSignupSuccess = () => {
    // After signup, redirect to dashboard (profile will be created automatically)
    navigate(ROUTES.DASHBOARD, { replace: true });
  };

  const switchToSignup = () => {
    setMode('signup');
  };

  const switchToLogin = () => {
    setMode('login');
  };

  const getLayoutTitle = () => {
    return mode === 'login' ? 'Welcome Back' : 'Join LMQB';
  };

  const getLayoutSubtitle = () => {
    return mode === 'login' 
      ? 'Sign in to continue your learning journey'
      : 'Create your account and start learning';
  };

  return (
    <AuthLayout 
      title={getLayoutTitle()} 
      subtitle={getLayoutSubtitle()}
    >
      {mode === 'login' ? (
        <LoginForm
          onSuccess={handleLoginSuccess}
          onSwitchToSignup={switchToSignup}
        />
      ) : (
        <SignupForm
          onSuccess={handleSignupSuccess}
          onSwitchToLogin={switchToLogin}
        />
      )}
    </AuthLayout>
  );
};

export default Login;