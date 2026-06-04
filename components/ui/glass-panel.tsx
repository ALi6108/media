import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[2.5rem] backdrop-blur-md bg-[var(--galactic-deep)]/40 ring-1 ring-white/5 shadow-inner transition-all duration-300",
        className
      )}
      {...props}
    />
  )
)
GlassPanel.displayName = "GlassPanel"

export { GlassPanel }
