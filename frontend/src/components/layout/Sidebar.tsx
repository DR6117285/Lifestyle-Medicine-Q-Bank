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
  { name: 'Practice Quiz', href: '/landing', icon: Play },
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
          "fixed top-0 left-0 z-50 h-full w-72 bg-white/98 backdrop-blur-xl border-r border-slate-200/60 transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 shadow-soft",
          isOpen ? "translate-x-0 shadow-large" : "-translate-x-full"
        )}
        style={{ 
          backgroundColor: 'rgb(255, 255, 255)', 
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRight: '1px solid rgb(226, 232, 240)'
        }}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Logo/Header */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-medical"
                style={{ 
                  background: 'linear-gradient(135deg, rgb(14, 165, 233) 0%, rgb(20, 184, 166) 100%)',
                }}
              >
                <span className="text-white font-bold text-sm tracking-tight">LM</span>
              </div>
              <span className="font-bold text-xl text-gradient tracking-tight">LMQB</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-8 bg-white">
            {/* Main Navigation */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Main Menu
              </h3>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => window.innerWidth < 1024 && onClose()}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                          isActive 
                            ? "bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 shadow-sm" 
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        )
                      }
                      style={({ isActive }) => isActive ? {
                        backgroundColor: 'rgba(14, 165, 233, 0.08)',
                        borderColor: 'rgba(14, 165, 233, 0.2)',
                        color: 'rgb(14, 165, 233)'
                      } : {}}
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
                <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Administration
                </h3>
                <div className="space-y-1">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                            isActive 
                              ? "bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border border-red-200 shadow-sm" 
                              : "text-slate-700 hover:bg-red-50/50 hover:text-red-600"
                          )
                        }
                      >
                        <Icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105 mr-3" />
                        <span className="font-medium">{item.name}</span>
                        {/* Admin indicator */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full opacity-60" />
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* User Info */}
          {user && (
            <div 
              className="p-4 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-white"
              style={{ backgroundColor: 'rgb(248, 250, 252)' }}
            >
              <div 
                className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200/60 shadow-soft"
                style={{ backgroundColor: 'rgb(255, 255, 255)' }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-sm"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)',
                    borderColor: 'rgba(14, 165, 233, 0.2)'
                  }}
                >
                  <span className="text-primary font-bold text-base">
                    {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'rgb(34, 197, 94)' }}
                    />
                    <p className="text-xs text-slate-500 capitalize font-medium">
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