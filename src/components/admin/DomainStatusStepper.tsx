import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainStatus } from "@/hooks/useBrandDomain";

interface DomainStatusStepperProps {
  status: DomainStatus | null;
  className?: string;
}

const STEPS = [
  { key: "configure", label: "Configure", statuses: [] },
  { key: "dns", label: "Add DNS", statuses: ["pending"] },
  { key: "verify", label: "Verify", statuses: ["verifying"] },
  { key: "ssl", label: "SSL", statuses: ["verified", "provisioning_ssl"] },
  { key: "active", label: "Active", statuses: ["active"] },
];

function getStepState(
  stepStatuses: string[],
  currentStatus: DomainStatus | null,
  stepIndex: number
): "completed" | "current" | "pending" | "error" {
  if (!currentStatus) {
    return stepIndex === 0 ? "current" : "pending";
  }

  if (currentStatus === "failed") {
    // Find which step failed based on common failure points
    const failedStepIndex = 2; // Usually verification fails
    if (stepIndex < failedStepIndex) return "completed";
    if (stepIndex === failedStepIndex) return "error";
    return "pending";
  }

  // Check if this step is completed
  const statusOrder = ["pending", "verifying", "verified", "provisioning_ssl", "active"];
  const currentIndex = statusOrder.indexOf(currentStatus);

  // Map status to step index
  const statusToStep: Record<string, number> = {
    pending: 1,
    verifying: 2,
    verified: 3,
    provisioning_ssl: 3,
    active: 4,
  };

  const currentStepIndex = statusToStep[currentStatus] ?? 0;

  if (stepIndex < currentStepIndex) return "completed";
  if (stepIndex === currentStepIndex) return "current";
  return "pending";
}

export function DomainStatusStepper({ status, className }: DomainStatusStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const state = getStepState(step.statuses, status, index);
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.key} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    state === "completed" && "bg-primary text-primary-foreground",
                    state === "current" && "bg-primary/20 text-primary border-2 border-primary",
                    state === "pending" && "bg-muted text-muted-foreground",
                    state === "error" && "bg-destructive text-destructive-foreground"
                  )}
                >
                  {state === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : state === "current" && status && ["verifying", "provisioning_ssl"].includes(status) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    state === "completed" && "text-primary",
                    state === "current" && "text-foreground",
                    state === "pending" && "text-muted-foreground",
                    state === "error" && "text-destructive"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-[-20px]",
                    state === "completed" ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
