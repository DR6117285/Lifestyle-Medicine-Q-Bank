import * as React from "react"
import { cn, getInitials, getColorFromName } from "../../lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  name?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", name, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)
    const [imageLoaded, setImageLoaded] = React.useState(false)

    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-lg"
    }

    const displayFallback = React.useMemo(() => {
      if (fallback) return fallback
      if (name) return getInitials(name)
      if (alt) return getInitials(alt)
      return "?"
    }, [fallback, name, alt])

    const colorClass = name ? getColorFromName(name) : "bg-muted"

    const handleImageError = () => {
      setImageError(true)
    }

    const handleImageLoad = () => {
      setImageLoaded(true)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          <>
            <img
              src={src}
              alt={alt || name || "Avatar"}
              className={cn(
                "aspect-square h-full w-full object-cover transition-opacity",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            {!imageLoaded && (
              <div className={cn(
                "absolute inset-0 flex items-center justify-center text-white font-semibold",
                colorClass
              )}>
                {displayFallback}
              </div>
            )}
          </>
        ) : (
          <div className={cn(
            "flex h-full w-full items-center justify-center text-white font-semibold",
            colorClass
          )}>
            {displayFallback}
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

// Avatar group for showing multiple avatars
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<{
    src?: string
    alt?: string
    name?: string
    fallback?: string
  }>
  max?: number
  size?: "sm" | "md" | "lg" | "xl"
  spacing?: "tight" | "normal" | "loose"
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, avatars, max = 5, size = "md", spacing = "normal", ...props }, ref) => {
    const visibleAvatars = avatars.slice(0, max)
    const remainingCount = Math.max(0, avatars.length - max)

    const spacingClasses = {
      tight: "-space-x-1",
      normal: "-space-x-2",
      loose: "-space-x-1"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {visibleAvatars.map((avatar, index) => (
          <div
            key={index}
            className="ring-2 ring-background rounded-full"
          >
            <Avatar
              src={avatar.src}
              alt={avatar.alt}
              name={avatar.name}
              fallback={avatar.fallback}
              size={size}
            />
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="ring-2 ring-background rounded-full">
            <Avatar
              size={size}
              fallback={`+${remainingCount}`}
            />
          </div>
        )}
      </div>
    )
  }
)
AvatarGroup.displayName = "AvatarGroup"

export { Avatar, AvatarGroup }