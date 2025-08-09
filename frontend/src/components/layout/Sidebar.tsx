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
          "fixed top-0 left-0 z-50 h-full w-72 bg-card/95 backdrop-blur-md border-r border-border/50 transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">LM</span>
              </div>
              <span className="font-bold text-xl text-gradient">LMQB</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-8">
            {/* Main Navigation */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
                          "nav-item group",
                          isActive && "active"
                        )
                      }
                    >
                      <Icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div>
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
                            "nav-item group",
                            isActive 
                              ? "bg-destructive/10 text-destructive border border-destructive/20" 
                              : "hover:bg-destructive/5 hover:text-destructive"
                          )
                        }
                      >
                        <Icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* User Info */}
          {user && (
            <div className="p-4 border-t border-border/50 bg-muted/30">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-success-500"></div>
                    <p className="text-xs text-muted-foreground capitalize">
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