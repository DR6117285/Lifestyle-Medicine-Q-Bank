import { useState } from 'react';
import { User, LogOut, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export const Header = ({ onMenuToggle, isSidebarOpen }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  const getUserInitials = (name: string | undefined, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email[0].toUpperCase();
  };

  return (
    <header className="bg-card border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-4 lg:px-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMenuToggle}
            className="lg:hidden hover:bg-muted focus-ring"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">LM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient tracking-tight">
                Lifestyle Medicine Q-Bank
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Medical Education Platform
              </p>
            </div>
          </div>
        </div>

        {user && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-muted transition-all duration-200 focus-ring"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 flex items-center justify-center">
                <span className="font-semibold text-sm text-primary">
                  {getUserInitials(user.displayName, user.email)}
                </span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-foreground">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground capitalize flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success-500"></div>
                  <span>{user.role}</span>
                </p>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-large border border-border/50 py-2 z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="text-sm font-semibold text-foreground">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-success-500"></div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
                
                <div className="py-1">
                  <button className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors flex items-center space-x-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Profile</span>
                  </button>
                  
                  <button className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors flex items-center space-x-3">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>Settings</span>
                  </button>
                </div>
                
                <div className="border-t border-border/50 my-1"></div>
                
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center space-x-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay for mobile menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-xs"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
};