import React, { useEffect, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { checkSupabaseConnection } from '@/utils/supabaseClient';

// Import components with error boundaries
const Login = React.lazy(() => import('@/pages/Login').then(module => ({ default: module.Login })));
const Dashboard = React.lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const LandingPage = React.lazy(() => import('@/pages/LandingPage').then(module => ({ default: module.LandingPage })));
const QuizPage = React.lazy(() => import('@/pages/QuizPage').then(module => ({ default: module.QuizPage })));
const Statistics = React.lazy(() => import('@/pages/Statistics').then(module => ({ default: module.Statistics })));
const AdminPanel = React.lazy(() => import('@/pages/AdminPanel').then(module => ({ default: module.AdminPanel })));
const Layout = React.lazy(() => import('@/components/layout/Layout').then(module => ({ default: module.Layout })));

// Import new quiz components
const ProgressView = React.lazy(() => import('@/components/quiz/ProgressView'));
const ExamInterface = React.lazy(() => import('@/components/quiz/ExamInterface'));
const ExamComplete = React.lazy(() => import('@/components/quiz/ExamComplete'));

// Simple ProtectedRoute component
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔥 React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-lg">
            <h1 className="text-2xl font-bold text-red-900 mb-4">Something went wrong</h1>
            <p className="text-red-700 mb-4">
              The app encountered an error. Please check the browser console for details.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Error: {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

export default function App() {
  console.log('🔥 App: Component rendering');
  
  const { initialize, isLoading, isAuthenticated, error } = useAuthStore();
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    console.log('🔥 App: Starting initialization');
    
    // Check Supabase connection first
    checkSupabaseConnection().then(isConnected => {
      console.log('🔥 App: Supabase connection check result:', isConnected);
      setSupabaseStatus(isConnected ? 'connected' : 'disconnected');
      if (isConnected) {
        initialize().catch(err => {
          console.error('🔥 App: Failed to initialize:', err);
        });
      } else {
        console.error('🔥 App: Supabase is not connected. Please start the backend.');
      }
    }).catch(err => {
      console.error('🔥 App: Error checking Supabase connection:', err);
      setSupabaseStatus('disconnected');
    });
  }, [initialize]);

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
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg text-center">
          <h1 className="text-2xl font-bold text-red-900 mb-4">Backend Connection Failed</h1>
          <p className="text-red-700 mb-4">
            Cannot connect to Supabase backend. Please ensure the backend is running.
          </p>
          <div className="text-sm text-gray-600 mb-4">
            <p className="mb-2"><strong>To start the backend:</strong></p>
            <div className="bg-gray-100 p-3 rounded font-mono text-left">
              cd backend/docker<br/>
              ./start-supabase.sh
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes with Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/landing" element={
              <ProtectedRoute>
                <Layout>
                  <LandingPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/quiz" element={
              <ProtectedRoute>
                <Layout>
                  <QuizPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/progress" element={
              <ProtectedRoute>
                <Layout>
                  <ProgressView />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/exam" element={
              <ProtectedRoute>
                <Layout>
                  <ExamInterface 
                    onComplete={() => window.location.href = '/exam/complete'} 
                    onExit={() => window.location.href = '/'} 
                  />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/exam/complete" element={
              <ProtectedRoute>
                <Layout>
                  <ExamComplete 
                    onReturnHome={() => window.location.href = '/'}
                    onStartNewExam={() => window.location.href = '/exam'}
                    onReviewAnswers={() => window.location.href = '/review'}
                  />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/statistics" element={
              <ProtectedRoute>
                <Layout>
                  <Statistics />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <AdminPanel />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}