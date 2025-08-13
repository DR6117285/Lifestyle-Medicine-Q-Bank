import * as React from "react"
import { cn } from "@/utils/cn"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  variant?: "default" | "medical" | "success" | "warning" | "error"
  size?: "sm" | "default" | "lg"
  showValue?: boolean
  animated?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    variant = "default", 
    size = "default",
    showValue = false,
    animated = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizeClasses = {
      sm: "h-2",
      default: "h-3",
      lg: "h-4",
    }

    const variantClasses = {
      default: "bg-primary",
      medical: "bg-gradient-to-r from-primary to-accent",
      success: "bg-success-500",
      warning: "bg-orange-500",
      error: "bg-destructive",
    }

    return (
      <div className="relative">
        <div
          ref={ref}
          className={cn(
            "w-full bg-secondary/30 rounded-full overflow-hidden",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              variantClasses[variant],
              animated && "animate-pulse"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showValue && (
          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
            <span>{Math.round(percentage)}%</span>
            <span>{value}/{max}</span>
          </div>
        )}
      </div>
    )
  }
)

Progress.displayName = "Progress"

export { Progress }