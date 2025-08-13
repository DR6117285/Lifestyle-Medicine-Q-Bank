import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-medical hover:bg-primary/90 hover:shadow-medical-lg",
        destructive:
          "bg-destructive text-destructive-foreground shadow-medical hover:bg-destructive/90 hover:shadow-medical-lg",
        outline:
          "border-2 border-primary bg-card text-primary hover:bg-primary hover:text-primary-foreground shadow-medical hover:shadow-medical-lg",
        secondary:
          "bg-accent text-accent-foreground shadow-medical hover:bg-accent/90 hover:shadow-medical-lg",
        ghost: "text-primary hover:bg-primary/10 hover:text-primary hover:shadow-medical",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
        medical: "bg-gradient-to-r from-primary to-accent text-white shadow-medical-lg hover:shadow-medical-lg hover:from-primary/90 hover:to-accent/90",
        success: "bg-success text-success-foreground shadow-medical hover:bg-success/90 hover:shadow-medical-lg",
        warning: "bg-orange-500 text-white shadow-medical hover:bg-orange-600 hover:shadow-medical-lg",
        info: "bg-info text-info-foreground shadow-medical hover:bg-info/90 hover:shadow-medical-lg",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-md px-4 py-2 text-xs",
        lg: "h-12 rounded-lg px-8 py-3 text-base",
        xl: "h-14 rounded-xl px-10 py-4 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }