import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastIcon: React.FC<{ type: Toast['type']; className?: string }> = ({ type, className }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };
  
  const Icon = icons[type];
  return <Icon className={className} />;
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ 
  toast, 
  onDismiss 
}) => {
  const [isExiting, setIsExiting] = useState(false);
  
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 150);
  }, [toast.id, onDismiss]);

  React.useEffect(() => {
    if (toast.duration !== Infinity) {
      const timer = setTimeout(handleDismiss, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleDismiss]);

  const typeStyles = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-error-50 border-error-200 text-error-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    info: 'bg-slate-50 border-slate-200 text-slate-800',
  };

  const iconStyles = {
    success: 'text-success-600',
    error: 'text-error-600',
    warning: 'text-orange-600',
    info: 'text-slate-600',
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ease-out",
        typeStyles[toast.type],
        isExiting ? "opacity-0 scale-95 translate-x-full" : "opacity-100 scale-100 translate-x-0"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ToastIcon 
              type={toast.type} 
              className={cn("h-5 w-5", iconStyles[toast.type])} 
            />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">
              {toast.title}
            </p>
            {toast.description && (
              <p className="mt-1 text-sm opacity-90">
                {toast.description}
              </p>
            )}
            {toast.action && (
              <div className="mt-3">
                <button
                  onClick={toast.action.onClick}
                  className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 focus:ring-offset-transparent rounded"
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 focus:ring-offset-transparent p-1 hover:opacity-75"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: string) => void }> = ({ 
  toasts, 
  onDismiss 
}) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 py-6 pointer-events-none sm:items-start sm:justify-end sm:p-6"
      aria-live="assertive"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </div>,
    document.body
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

// Convenience hooks for different toast types
export const useToastHelpers = () => {
  const { showToast } = useToast();

  return {
    success: (title: string, description?: string, options?: Partial<Toast>) => 
      showToast({ title, description, type: 'success', ...options }),
    
    error: (title: string, description?: string, options?: Partial<Toast>) => 
      showToast({ title, description, type: 'error', duration: 7000, ...options }),
    
    warning: (title: string, description?: string, options?: Partial<Toast>) => 
      showToast({ title, description, type: 'warning', duration: 6000, ...options }),
    
    info: (title: string, description?: string, options?: Partial<Toast>) => 
      showToast({ title, description, type: 'info', ...options }),
  };
};