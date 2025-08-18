import React, { useEffect, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { checkSupabaseConnection } from '@/utils/supabaseClient';
import { ToastProvider } from '@/components/ui/Toast';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OfflineBanner } from '@/components/ui/ConnectionStatus';
import { useOnlineStatus } from '@/hooks/useOfflineSupport';
import { useIsMobile } from '@/components/layout/MobileLayout';
import { ProtectedRoute, PublicRoute } from '@/components/auth/ProtectedRoute';

// Import components with error boundaries
const Login = React.lazy(() => import('@/pages/Login').then(module => ({ default: module.Login })));
const EnhancedDashboard = React.lazy(() => import('@/pages/EnhancedDashboard').then(module => ({ default: module.EnhancedDashboard })));
const LandingPage = React.lazy(() => import('@/pages/LandingPage').then(module => ({ default: module.LandingPage })));
const QuizPage = React.lazy(() => import('@/pages/QuizPage').then(module => ({ default: module.QuizPage })));
const Statistics = React.lazy(() => import('@/pages/Statistics').then(module => ({ default: module.Statistics })));
const AdminPanel = React.lazy(() => import('@/pages/AdminPanel').then(module => ({ default: module.AdminPanel })));
const Layout = React.lazy(() => import('@/components/layout/Layout').then(module => ({ default: module.Layout })));
const MobileLayout = React.lazy(() => import('@/components/layout/MobileLayout').then(module => ({ default: module.MobileLayout })));

// Import new quiz components
const ProgressView = React.lazy(() => import('@/components/quiz/ProgressView').then(module => ({ default: module.default })));
const ExamInterface = React.lazy(() => import('@/components/quiz/ExamInterface').then(module => ({ default: module.default })));
const PrometricExamInterface = React.lazy(() => import('@/components/quiz/PrometricExamInterface').then(module => ({ default: module.default })));
const ExamComplete = React.lazy(() => import('@/components/quiz/ExamComplete').then(module => ({ default: module.default })));


// Note: ErrorBoundary is now imported from components/ui/ErrorBoundary.tsx

// Loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export default function App() {
  console.log('🔥 App: Component rendering');
  
  // ALL HOOKS MUST BE CALLED AT THE TOP - BEFORE ANY EARLY RETURNS
  const { initialize, isLoading, isAuthenticated, error } = useAuthStore();
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const isOnline = useOnlineStatus();
  const isMobile = useIsMobile();

  // Initialize Supabase connection and auth
  useEffect(() => {
    console.log('🔥 App: Starting initialization');
    
    // Check Supabase connection first
    checkSupabaseConnection().then(isConnected => {
      console.log('🔥 App: Supabase connection check result:', isConnected);
      setSupabaseStatus(isConnected ? 'connected' : 'disconnected');
      if (isConnected) {
        // Initialize auth if not already authenticated, not loading, and not already initializing
        const authState = useAuthStore.getState();
        if (!isAuthenticated && !isLoading && !authState._isInitializing) {
          console.log('🔥 App: Starting auth initialization');
          initialize().catch(err => {
            console.error('🔥 App: Failed to initialize auth:', err);
          });
        } else {
          console.log('🔥 App: Auth already initialized, loading, or initializing');
        }
      } else {
        console.error('🔥 App: Supabase is not connected. Please start the backend.');
      }
    }).catch(err => {
      console.error('🔥 App: Error checking Supabase connection:', err);
      setSupabaseStatus('disconnected');
    });
  }, [initialize, isAuthenticated, isLoading]);

  // Handle offline banner visibility
  useEffect(() => {
    if (!isOnline && isAuthenticated) {
      setShowOfflineBanner(true);
    } else {
      setShowOfflineBanner(false);
    }
  }, [isOnline, isAuthenticated]);

  console.log('🔥 App: Current state -', { isLoading, isAuthenticated, error: !!error, supabaseStatus });

  // Add a simple test render
  if (supabaseStatus === 'checking') {
    console.log('🔥 App: Rendering loading state');
  } else if (supabaseStatus === 'disconnected') {
    console.log('🔥 App: Rendering disconnected state');
  } else {
    console.log('🔥 App: Rendering main app');
  }

  if (supabaseStatus === 'checking') {
    return <LoadingFallback />;
  }

  if (supabaseStatus === 'disconnected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-lg shadow-medical max-w-lg text-center border border-destructive/20">
          <h1 className="text-2xl font-bold text-destructive mb-4">Backend Connection Failed</h1>
          <p className="text-destructive/80 mb-4">
            Cannot connect to Supabase backend. Please ensure the backend is running.
          </p>
          <div className="text-sm text-muted-foreground mb-4">
            <p className="mb-2 text-foreground"><strong>To start the backend:</strong></p>
            <div className="bg-muted p-3 rounded font-mono text-left text-foreground">
              cd backend/docker<br/>
              ./start-supabase.sh
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-medical"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingFallback />;
  }

  const AppLayout = isMobile ? MobileLayout : Layout;

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <ToastProvider>
          <Router>
            <OfflineBanner 
              show={showOfflineBanner} 
              onDismiss={() => setShowOfflineBanner(false)} 
            />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            {/* Protected Routes with Layout */}
            <Route path="/" element={
              <ProtectedRoute requireAuth={true}>
                <AppLayout>
                  <EnhancedDashboard />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute requireAuth={true}>
                <AppLayout>
                  <EnhancedDashboard />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/landing" element={
              <ProtectedRoute requireAuth={true}>
                <AppLayout>
                  <LandingPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/quiz" element={
              <ProtectedRoute requireAuth={true}>
                <AppLayout>
                  <QuizPage />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/progress" element={
              <ProtectedRoute requireAuth={true}>
                <AppLayout>
                  <ProgressView 
                    onReturn={() => window.location.href = '/quiz'}
                    onReturnHome={() => window.location.href = '/'}
                  />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/exam" element={
              <ExamInterface 
                onComplete={() => window.location.href = '/exam/complete'} 
                onExit={() => window.location.href = '/'} 
              />
            } />

            <Route path="/exam/complete" element={
              <ProtectedRoute requireAuth={true}>
                <AppLayout>
                  <ExamComplete 
                    onReturnHome={() => window.location.href = '/'}
                    onNewSession={() => window.location.href = '/exam'}
                    onReviewAnswers={() => window.location.href = '/review'}
                  />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/statistics" element={
              <ProtectedRoute requireAuth={true}>
                <AppLayout>
                  <Statistics />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute requireAuth={true} requiredRole="admin">
                <AppLayout>
                  <AdminPanel />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </Router>
        </ToastProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}