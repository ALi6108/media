import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-sm px-3 py-1 text-base transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white placeholder:text-[var(--galactic-diamond)]/50 focus-visible:border-[var(--galactic-aurora)]/50 focus-visible:ring-3 focus-visible:ring-[var(--galactic-aurora)]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-white/5 disabled:opacity-50 text-[var(--galactic-diamond)] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
