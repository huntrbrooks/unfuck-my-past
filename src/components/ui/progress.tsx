"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "bg-[#ff1aff]",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        destructive: "bg-destructive",
        gradient: "bg-gradient-to-r from-primary via-accent to-secondary",
        glass: "bg-white/20 backdrop-blur-sm",
      },
      size: {
        default: "h-3",
        sm: "h-2",
        lg: "h-4",
        xl: "h-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> &
    VariantProps<typeof progressVariants>
>(({ className, value, variant, size, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative w-full overflow-hidden rounded-full bg-secondary transition-all duration-300",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(progressVariants({ variant, size }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress, progressVariants }
