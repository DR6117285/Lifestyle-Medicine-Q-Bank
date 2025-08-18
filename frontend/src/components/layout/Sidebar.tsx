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
  { name: 'Practice', href: '/quiz', icon: Play },
  { name: 'Statistics', href: '/statistics', icon: BarChart3 },
  { name: 'Progress', href: '/progress', icon: BookOpen },
  { name: 'Timed Exam', href: '/exam', icon: Clock },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const adminNavItems: NavItem[] = [
  { name: 'Admin Panel', href: '/admin', icon: Shield },
  { name: 'Manage Users', href: '/admin/users', icon: Users },
  { name: 'Manage Questions', href: '/admin/questions', icon: FileText },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 sidebar-medical transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0 shadow-medical-lg" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full bg-transparent">
          {/* Logo/Header */}
          <div className="logo-section-medical flex items-center justify-center h-20 px-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center gradient-medical shadow-medical">
                <span className="text-white font-bold text-sm tracking-tight">LM</span>
              </div>
              <span className="font-bold text-xl text-gradient tracking-tight">LMQB</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-8 bg-transparent">
            {/* Main Navigation */}
            <div>
              <h3 className="px-3 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">
                Main Menu
              </h3>
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => window.innerWidth < 1024 && onClose()}
                      className={({ isActive }) =>
                        cn(
                          "nav-item-medical flex items-center px-4 py-3 text-sm font-medium group relative",
                          isActive ? "active" : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105 mr-3" />
                          <span className="font-medium">{item.name}</span>
                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full transition-all duration-200" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div>
                <h3 className="px-3 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">
                  Administration
                </h3>
                <div className="space-y-2">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                        className={({ isActive }) =>
                          cn(
                            "nav-item-medical flex items-center px-4 py-3 text-sm font-medium group relative",
                            isActive 
                              ? "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700/40 shadow-medical" 
                              : "text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                          )
                        }
                      >
                        <Icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105 mr-3" />
                        <span className="font-medium">{item.name}</span>
                        {/* Admin indicator */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-destructive rounded-full opacity-60" />
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* User Info */}
          {user && (
            <div className="user-info-medical p-4">
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-border shadow-medical bg-card">
                <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary/20 gradient-medical-soft">
                  <span className="text-primary font-bold text-base">
                    {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 capitalize font-medium">
                      {user.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};