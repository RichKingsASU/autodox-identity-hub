import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export interface RecessedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isValid?: boolean;
}

const RecessedInput = React.forwardRef<HTMLInputElement, RecessedInputProps>(
  ({ className, type, label, error, isValid, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-xl border border-border bg-[hsl(var(--surface-recessed))] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              "shadow-recessed",
              isValid && "border-success focus:border-success focus:ring-success/20",
              error && "border-destructive focus:border-destructive focus:ring-destructive/20",
              className
            )}
            ref={ref}
            {...props}
          />
          {isValid && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <div className="h-5 w-5 rounded-full bg-success flex items-center justify-center glow-success">
                <Check className="h-3 w-3 text-success-foreground" />
              </div>
            </motion.div>
          )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-destructive"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);
RecessedInput.displayName = "RecessedInput";

export { RecessedInput };
