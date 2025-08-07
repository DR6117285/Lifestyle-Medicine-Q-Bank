import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Play, 
  BarChart3, 
  Settings, 
  Users, 
  FileText, 
  Clock,
  BookOpen,
  Shield
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Practice Quiz', href: '/quiz', icon: Play },
  { name: 'Statistics', href: '/statistics', icon: BarChart3 },
  { name: 'Study Sections', href: '/sections', icon: BookOpen },
  { name: 'Timed Practice', href: '/timed', icon: Clock },
  { name: 'Admin Panel', href: '/admin', icon: Shield, adminOnly: true },
  { name: 'Manage Users', href: '/admin/users', icon: Users, adminOnly: true },
  { name: 'Manage Questions', href: '/admin/questions', icon: FileText, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">LM</span>
              </div>
              <span className="font-semibold text-gray-900">LMQB</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )
                    }
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administration
                </h3>
                <div className="mt-3 space-y-2">
                  <NavLink
                    to="/admin"
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-red-50 text-red-700 border-r-2 border-red-700"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )
                    }
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span>Admin Dashboard</span>
                  </NavLink>
                </div>
              </div>
            )}
          </nav>

          {/* User Info */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};