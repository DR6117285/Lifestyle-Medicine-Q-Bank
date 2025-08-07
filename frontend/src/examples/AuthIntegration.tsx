import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { ProtectedRoute, AdminProtectedRoute, PublicRoute } from '../components/auth/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';

// Example Dashboard Component
const Dashboard: React.FC = () => {
  const { user, getDisplayName, getUserInitials, getLastActiveFormatted } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {getDisplayName()}!
          </h1>
          
          {/* User Info Card */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 rounded-full w-12 h-12 flex items-center justify-center">
                <span className="text-white font-medium">
                  {getUserInitials()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.displayName}</p>
                <p className="text-gray-600 text-sm">{user?.email}</p>
                <p className="text-gray-500 text-xs">
                  Role: {user?.role} • Last active: {getLastActiveFormatted()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Start Quiz</h3>
              <p className="text-green-700 text-sm">Begin a new quiz session</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-2">View Progress</h3>
              <p className="text-purple-700 text-sm">Check your learning progress</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-medium text-orange-900 mb-2">Practice Mode</h3>
              <p className="text-orange-700 text-sm">Practice with specific topics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Example Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const { user, getDisplayName } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Admin Dashboard - Welcome, {getDisplayName()}!
          </h1>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              <strong>Admin Access:</strong> You have administrative privileges.
            </p>
          </div>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500 text-white rounded-lg p-4">
              <h3 className="font-medium mb-2">Total Users</h3>
              <p className="text-2xl font-bold">1,234</p>
            </div>
            
            <div className="bg-green-500 text-white rounded-lg p-4">
              <h3 className="font-medium mb-2">Active Sessions</h3>
              <p className="text-2xl font-bold">89</p>
            </div>
            
            <div className="bg-purple-500 text-white rounded-lg p-4">
              <h3 className="font-medium mb-2">Questions</h3>
              <p className="text-2xl font-bold">2,456</p>
            </div>
            
            <div className="bg-orange-500 text-white rounded-lg p-4">
              <h3 className="font-medium mb-2">Categories</h3>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-600 text-sm mb-3">Manage user accounts and permissions</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                Manage Users
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Content Management</h3>
              <p className="text-gray-600 text-sm mb-3">Add and edit questions and categories</p>
              <button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                Manage Content
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Example Profile Component
const Profile: React.FC = () => {
  const { user, updateProfile, getDisplayName, isLoading } = useAuth();
  const [displayName, setDisplayName] = React.useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage('');

    const result = await updateProfile({ displayName });
    
    if (result.success) {
      setMessage('Profile updated successfully!');
    } else {
      setMessage(result.error || 'Failed to update profile');
    }
    
    setIsUpdating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
          
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your display name"
                disabled={isUpdating}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                id="role"
                type="text"
                value={user?.role || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 capitalize"
              />
              <p className="mt-1 text-xs text-gray-500">Role is assigned by administrators</p>
            </div>

            {message && (
              <div className={`p-4 rounded-md ${
                message.includes('success') 
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdating || isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Example App Component showing full integration
const AuthIntegrationExample: React.FC = () => {
  const { initialize, isLoading } = useAuth();

  // Initialize auth on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading screen during initialization
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path={ROUTES.LOGIN} 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />

        {/* Protected routes */}
        <Route 
          path={ROUTES.DASHBOARD} 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path={ROUTES.PROFILE} 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        {/* Admin-only routes */}
        <Route 
          path={ROUTES.ADMIN} 
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } 
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </Router>
  );
};

export default AuthIntegrationExample;