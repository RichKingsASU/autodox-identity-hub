import { useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

type StrengthLevel = "weak" | "medium" | "strong" | "very-strong";

interface StrengthResult {
  level: StrengthLevel;
  score: number;
  label: string;
}

function calculateStrength(password: string): StrengthResult {
  if (!password) return { level: "weak", score: 0, label: "Enter a password" };

  let score = 0;
  const length = password.length;

  // Length scoring
  if (length >= 6) score += 1;
  if (length >= 10) score += 1;
  if (length >= 14) score += 1;
  if (length >= 18) score += 1;

  // Character diversity scoring
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Determine level
  if (score <= 2) return { level: "weak", score: 25, label: "Weak" };
  if (score <= 4) return { level: "medium", score: 50, label: "Medium" };
  if (score <= 6) return { level: "strong", score: 75, label: "Strong" };
  return { level: "very-strong", score: 100, label: "Very Strong" };
}

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);

  const strengthColors = {
    weak: "bg-destructive",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
    "very-strong": "bg-emerald-400",
  };

  const strengthTextColors = {
    weak: "text-destructive",
    medium: "text-yellow-500",
    strong: "text-green-500",
    "very-strong": "text-emerald-400",
  };

  const StrengthIcon = strength.level === "weak" ? ShieldAlert : 
    strength.level === "medium" ? Shield : ShieldCheck;

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StrengthIcon className={`h-4 w-4 ${strengthTextColors[strength.level]}`} />
          <span className="text-xs font-medium text-muted-foreground">Strength</span>
        </div>
        <span className={`text-xs font-semibold ${strengthTextColors[strength.level]}`}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${strengthColors[strength.level]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${strength.score}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
