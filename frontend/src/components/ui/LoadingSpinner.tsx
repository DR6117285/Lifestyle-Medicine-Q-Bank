import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'medical' | 'success';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const variantClasses = {
  default: 'text-primary',
  medical: 'text-medical-600',
  success: 'text-success-600'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  text,
  fullScreen = false
}) => {
  const spinner = (
    <div className={cn(
      "flex items-center justify-center gap-3",
      fullScreen ? "min-h-screen" : "py-8",
      className
    )}>
      <Loader2 
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )} 
      />
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Skeleton components for better loading states
export const QuestionSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-4 bg-muted rounded w-3/4"></div>
    <div className="h-6 bg-muted rounded w-full"></div>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="h-4 w-4 bg-muted rounded-full"></div>
          <div className="h-4 bg-muted rounded flex-1"></div>
        </div>
      ))}
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 bg-muted rounded-lg"></div>
      ))}
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <div className="h-64 bg-muted rounded-lg"></div>
      <div className="h-64 bg-muted rounded-lg"></div>
    </div>
  </div>
);

export const StatisticsSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-muted rounded w-1/3"></div>
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      ))}
    </div>
    <div className="h-80 bg-muted rounded-lg"></div>
  </div>
);