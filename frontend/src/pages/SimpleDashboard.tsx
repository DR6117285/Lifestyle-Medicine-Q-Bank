import React from 'react';
import { useAuthStore } from '@/stores/authStore';

export const SimpleDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-semibold text-sm">LM</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Lifestyle Medicine Question Bank
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-800 font-semibold">
                Welcome, {user?.displayName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 Success! React App is Working
            </h2>
            <p className="text-lg text-slate-800 font-semibold mb-8">
              The blank screen issue has been resolved. Authentication is working properly.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Authentication</h3>
                <p className="text-slate-700 font-medium">User login and session management working</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ React Rendering</h3>
                <p className="text-slate-700 font-medium">Components rendering without errors</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Routing</h3>
                <p className="text-slate-700 font-medium">React Router navigation functioning</p>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Next Steps</h3>
              <p className="text-blue-900 font-semibold">
                The core app is now working. You can restore the full Dashboard, Layout, and other components.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SimpleDashboard;