import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-white hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-white hover:bg-warning/80",
        medical:
          "border-transparent bg-medical-blue text-white hover:bg-medical-blue/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// Specialized badges for the medical/educational context
interface StatusBadgeProps extends BadgeProps {
  status: "active" | "inactive" | "completed" | "pending" | "failed"
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const getVariantFromStatus = (status: string) => {
    switch (status) {
      case "active":
        return "success"
      case "completed":
        return "success"
      case "inactive":
        return "secondary"
      case "pending":
        return "warning"
      case "failed":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <Badge 
      variant={getVariantFromStatus(status)} 
      className={className}
      {...props}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

interface ScoreBadgeProps extends BadgeProps {
  score: number
  total?: number
}

function ScoreBadge({ score, total = 100, className, ...props }: ScoreBadgeProps) {
  const percentage = total > 0 ? (score / total) * 100 : 0
  
  const getVariantFromScore = (percentage: number) => {
    if (percentage >= 80) return "success"
    if (percentage >= 60) return "warning"
    return "destructive"
  }

  return (
    <Badge 
      variant={getVariantFromScore(percentage)} 
      className={className}
      {...props}
    >
      {Math.round(percentage)}%
    </Badge>
  )
}

interface DifficultyBadgeProps extends BadgeProps {
  difficulty: "easy" | "medium" | "hard"
}

function DifficultyBadge({ difficulty, className, ...props }: DifficultyBadgeProps) {
  const getVariantFromDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "success"
      case "medium":
        return "warning"
      case "hard":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <Badge 
      variant={getVariantFromDifficulty(difficulty)} 
      className={className}
      {...props}
    >
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </Badge>
  )
}

export { Badge, badgeVariants, StatusBadge, ScoreBadge, DifficultyBadge }