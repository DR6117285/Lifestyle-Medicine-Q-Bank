import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, Target, TrendingUp } from 'lucide-react';

// Memoized Question Card for better performance in lists
interface QuestionCardProps {
  question: {
    id: number;
    questionText: string;
    category?: string;
    difficulty?: string;
    isAnswered?: boolean;
    isCorrect?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export const MemoizedQuestionCard = memo<QuestionCardProps>(({ 
  question, 
  onClick,
  className 
}) => {
  const statusIcon = useMemo(() => {
    if (!question.isAnswered) return null;
    return question.isCorrect ? (
      <CheckCircle className="h-5 w-5 text-success-600" />
    ) : (
      <XCircle className="h-5 w-5 text-error-600" />
    );
  }, [question.isAnswered, question.isCorrect]);

  const difficultyColor = useMemo(() => {
    switch (question.difficulty) {
      case 'easy': return 'border-success-300 text-success-700';
      case 'medium': return 'border-slate-300 text-slate-700';
      case 'hard': return 'border-error-300 text-error-700';
      default: return 'border-slate-300 text-slate-700';
    }
  }, [question.difficulty]);

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow duration-200",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base leading-relaxed">
            {question.questionText}
          </CardTitle>
          {statusIcon}
        </div>
        <div className="flex gap-2">
          {question.category && (
            <Badge variant="secondary" className="text-xs">
              {question.category}
            </Badge>
          )}
          {question.difficulty && (
            <Badge 
              variant="outline" 
              className={cn("text-xs", difficultyColor)}
            >
              {question.difficulty}
            </Badge>
          )}
        </div>
      </CardHeader>
    </Card>
  );
});

MemoizedQuestionCard.displayName = 'MemoizedQuestionCard';

// Memoized Statistics Card
interface StatisticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'orange' | 'error';
  className?: string;
}

export const MemoizedStatisticsCard = memo<StatisticsCardProps>(({
  title,
  value,
  change,
  icon: Icon,
  variant = 'default',
  className
}) => {
  const variantStyles = useMemo(() => {
    switch (variant) {
      case 'success':
        return 'border-success-200 bg-success-50 text-success-900';
      case 'orange':
        return 'border-slate-200 bg-slate-50 text-slate-700';
      case 'error':
        return 'border-error-200 bg-error-50 text-error-900';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-800';
    }
  }, [variant]);

  const changeColor = useMemo(() => {
    if (change === undefined) return '';
    return change > 0 ? 'text-success-600' : change < 0 ? 'text-error-600' : 'text-slate-600';
  }, [change]);

  return (
    <Card className={cn(variantStyles, className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {change !== undefined && (
                <span className={cn("text-sm font-medium flex items-center gap-1", changeColor)}>
                  <TrendingUp className="h-3 w-3" />
                  {change > 0 ? '+' : ''}{change}%
                </span>
              )}
            </div>
          </div>
          <Icon className="h-8 w-8 opacity-80" />
        </div>
      </CardContent>
    </Card>
  );
});

MemoizedStatisticsCard.displayName = 'MemoizedStatisticsCard';

// Memoized Progress Ring for better performance
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
}

export const MemoizedProgressRing = memo<ProgressRingProps>(({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  showPercentage = true
}) => {
  const { radius, circumference, strokeDashoffset } = useMemo(() => {
    const r = (size - strokeWidth) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (progress / 100) * c;
    
    return {
      radius: r,
      circumference: c,
      strokeDashoffset: offset
    };
  }, [size, strokeWidth, progress]);

  const center = size / 2;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-400 opacity-40"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-slate-600 transition-all duration-300 ease-out"
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
});

MemoizedProgressRing.displayName = 'MemoizedProgressRing';

// Memoized Timer Component
interface TimerDisplayProps {
  timeRemaining: number;
  isActive: boolean;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
}

export const MemoizedTimerDisplay = memo<TimerDisplayProps>(({
  timeRemaining,
  isActive,
  onPause,
  onResume,
  className
}) => {
  const formattedTime = useMemo(() => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  const isUrgent = timeRemaining < 300; // Less than 5 minutes

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      isUrgent ? "border-error-300 bg-error-50" : "border-slate-300 bg-slate-50",
      className
    )}>
      <Clock className={cn(
        "h-5 w-5",
        isUrgent ? "text-error-600" : "text-slate-600"
      )} />
      <span className={cn(
        "font-mono text-lg font-semibold",
        isUrgent ? "text-error-900" : "text-slate-800"
      )}>
        {formattedTime}
      </span>
      {(onPause || onResume) && (
        <Button
          size="sm"
          variant="outline"
          onClick={isActive ? onPause : onResume}
        >
          {isActive ? 'Pause' : 'Resume'}
        </Button>
      )}
    </div>
  );
});

MemoizedTimerDisplay.displayName = 'MemoizedTimerDisplay';

// Memoized Dashboard Quick Actions
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
}

export const MemoizedQuickAction = memo<QuickActionProps>(({
  title,
  description,
  icon: Icon,
  onClick,
  variant = 'default',
  className
}) => {
  const variantStyles = useMemo(() => {
    switch (variant) {
      case 'primary':
        return 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800';
      case 'secondary':
        return 'border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-900';
      default:
        return 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900';
    }
  }, [variant]);

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        variantStyles,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-lg",
            variant === 'primary' ? "bg-slate-600 text-white" :
            variant === 'secondary' ? "bg-teal-600 text-white" :
            "bg-slate-200 text-slate-700"
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-slate-700">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MemoizedQuickAction.displayName = 'MemoizedQuickAction';