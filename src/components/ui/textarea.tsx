import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => {
  return (
    <textarea className={cn(
      "flex min-h-[120px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:border-border/80 focus:border-primary focus:shadow-lg focus:shadow-primary/10 resize-none",
      className
    )} ref={ref} {...props} />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
