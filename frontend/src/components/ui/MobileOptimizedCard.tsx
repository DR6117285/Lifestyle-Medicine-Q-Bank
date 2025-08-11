import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardProps } from '@/components/ui/card';

interface MobileOptimizedCardProps extends CardProps {
  enableSwipe?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  children: React.ReactNode;
}

export const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  enableSwipe = false,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 50,
  className,
  children,
  ...props
}) => {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enableSwipe) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setCurrentX(touch.clientX);
    setIsSwipeActive(true);
  }, [enableSwipe]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enableSwipe || !isSwipeActive) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    // Prevent vertical scrolling interference
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      setCurrentX(touch.clientX);
      
      // Apply visual feedback
      if (cardRef.current) {
        cardRef.current.style.transform = `translateX(${deltaX * 0.3}px)`;
        cardRef.current.style.opacity = `${1 - Math.abs(deltaX) * 0.001}`;
      }
    }
  }, [enableSwipe, isSwipeActive, startX, startY]);

  const handleTouchEnd = useCallback(() => {
    if (!enableSwipe || !isSwipeActive) return;
    
    const deltaX = currentX - startX;
    setIsSwipeActive(false);
    
    // Reset visual state
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(0)';
      cardRef.current.style.opacity = '1';
    }
    
    // Trigger swipe actions
    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    // Reset state
    setStartX(0);
    setStartY(0);
    setCurrentX(0);
  }, [enableSwipe, isSwipeActive, currentX, startX, swipeThreshold, onSwipeLeft, onSwipeRight]);

  return (
    <Card
      ref={cardRef}
      className={cn(
        "transition-all duration-200",
        enableSwipe && "touch-pan-y select-none",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {children}
    </Card>
  );
};

// Mobile-optimized button component
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'medical';
  size?: 'sm' | 'md' | 'lg' | 'touch';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  variant = 'default',
  size = 'touch',
  fullWidth = false,
  className,
  children,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
    ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
    medical: "bg-medical-600 text-white hover:bg-medical-700 active:bg-medical-800"
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 py-2 px-4",
    lg: "h-11 px-8",
    touch: "h-12 px-4 text-base min-w-[44px]" // 44px minimum touch target
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        // Enhanced touch feedback
        "active:scale-95 active:transition-transform active:duration-75",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Mobile-friendly progress indicator
interface MobileProgressProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const MobileProgress: React.FC<MobileProgressProps> = ({
  value,
  max = 100,
  className,
  showPercentage = true,
  size = 'md'
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className={cn(
        "relative overflow-hidden rounded-full bg-muted",
        sizes[size]
      )}>
        <div
          className="h-full bg-medical-600 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-muted-foreground text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

// Swipeable question navigation
interface SwipeableQuestionNavProps {
  currentIndex: number;
  totalQuestions: number;
  onNext: () => void;
  onPrevious: () => void;
  children: React.ReactNode;
  className?: string;
}

export const SwipeableQuestionNav: React.FC<SwipeableQuestionNavProps> = ({
  currentIndex,
  totalQuestions,
  onNext,
  onPrevious,
  children,
  className
}) => {
  const canGoNext = currentIndex < totalQuestions - 1;
  const canGoPrevious = currentIndex > 0;

  return (
    <MobileOptimizedCard
      enableSwipe
      onSwipeLeft={canGoNext ? onNext : undefined}
      onSwipeRight={canGoPrevious ? onPrevious : undefined}
      className={cn("relative", className)}
    >
      {children}
      
      {/* Swipe indicators */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
        {canGoPrevious && (
          <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            ← Swipe for previous
          </div>
        )}
        {canGoNext && (
          <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            Swipe for next →
          </div>
        )}
      </div>
    </MobileOptimizedCard>
  );
};