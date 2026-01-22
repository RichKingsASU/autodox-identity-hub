import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  isValid?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, isValid, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className={cn(
              "flex h-12 w-full rounded-xl border border-border bg-[hsl(var(--surface-recessed))] px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              "shadow-recessed",
              isValid && "border-success focus:border-success focus:ring-success/20",
              error && "border-destructive focus:border-destructive focus:ring-destructive/20",
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isValid && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="h-5 w-5 rounded-full bg-success flex items-center justify-center glow-success">
                  <Check className="h-3 w-3 text-success-foreground" />
                </div>
              </motion.div>
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 rounded-md hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
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
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
