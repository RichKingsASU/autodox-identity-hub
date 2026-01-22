import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
  {
    variants: {
      status: {
        delivered: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        active: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        approved: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        verified: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        open: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        resolved: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        failed: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
        error: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
        suspended: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
        pending: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        review: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        in_progress: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        unverified: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
);

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusPillVariants> {
  children?: React.ReactNode;
}

const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, status, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(statusPillVariants({ status, className }))}
        {...props}
      >
        <span className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "delivered" || status === "success" || status === "active" || status === "approved" || status === "verified" || status === "resolved" ? "bg-emerald-400" :
          status === "failed" || status === "error" || status === "suspended" ? "bg-rose-400" :
          status === "pending" || status === "review" || status === "in_progress" ? "bg-amber-400" :
          status === "open" ? "bg-blue-400" :
          "bg-slate-400"
        )} />
        {children || <span className="capitalize">{status}</span>}
      </span>
    );
  }
);
StatusPill.displayName = "StatusPill";

export { StatusPill, statusPillVariants };
