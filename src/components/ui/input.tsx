import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-2xl border border-ink-100 bg-white/90 px-4 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strawberry-300 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
