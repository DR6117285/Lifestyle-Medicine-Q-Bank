import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X, Home, BookOpen, BarChart3, User, Settings } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/quiz', icon: BookOpen, label: 'Quiz' },
  { href: '/statistics', icon: BarChart3, label: 'Stats' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile Header */}
      <header className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow duration-200",
        isScrolled && "shadow-sm"
      )}>
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 -ml-2 rounded-md hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-medical-900">
              LMQB
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground hidden sm:block">
              {user?.displayName}
            </div>
            <div className="h-8 w-8 rounded-full bg-medical-100 flex items-center justify-center">
              <span className="text-xs font-medium text-medical-800">
                {user?.displayName?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-full w-72 bg-background border-r shadow-lg transform transition-transform duration-300 ease-out">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-medical-600 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-medical-900">LMQB</h2>
                  <p className="text-xs text-muted-foreground">Lifestyle Medicine</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-md hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation",
                        location.pathname === item.href
                          ? "bg-medical-100 text-medical-900"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              {/* Logout Button */}
              <div className="mt-8 pt-8 border-t">
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-error-600 hover:bg-error-50 w-full text-left touch-manipulation"
                >
                  <Settings className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container px-4 py-6 mx-auto max-w-screen-xl">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Alternative mobile navigation) */}
      <div className="sticky bottom-0 z-30 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:hidden">
        <nav className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-lg transition-colors touch-manipulation min-w-[64px]",
                location.pathname === item.href
                  ? "text-medical-600"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

// Hook to detect mobile/touch device
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const isMobileDevice = 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768 ||
        ('ontouchstart' in window);
      
      setIsMobile(isMobileDevice);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// Hook for safe area insets (for devices with notches)
export const useSafeArea = () => {
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeAreaInsets({
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0,
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeAreaInsets;
};