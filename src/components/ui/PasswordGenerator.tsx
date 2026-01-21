import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Copy, Check, Key, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PasswordGeneratorProps {
  onSelect?: (password: string) => void;
  defaultLength?: number;
}

type StrengthLevel = "weak" | "medium" | "strong" | "very-strong";

function calculateStrength(
  password: string,
  hasUpper: boolean,
  hasLower: boolean,
  hasNumbers: boolean,
  hasSymbols: boolean
): { level: StrengthLevel; score: number; label: string } {
  if (!password) return { level: "weak", score: 0, label: "Generate a key" };

  let score = 0;
  const length = password.length;

  // Length scoring
  if (length >= 8) score += 1;
  if (length >= 16) score += 1;
  if (length >= 24) score += 1;
  if (length >= 32) score += 1;

  // Character diversity scoring
  const charTypes = [hasUpper, hasLower, hasNumbers, hasSymbols].filter(Boolean).length;
  score += charTypes;

  // Determine level
  if (score <= 2) return { level: "weak", score: 25, label: "Weak" };
  if (score <= 4) return { level: "medium", score: 50, label: "Medium" };
  if (score <= 6) return { level: "strong", score: 75, label: "Strong" };
  return { level: "very-strong", score: 100, label: "Very Strong" };
}

export function PasswordGenerator({ onSelect, defaultLength = 32 }: PasswordGeneratorProps) {
  const [length, setLength] = useState(defaultLength);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let charset = "";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (charset === "") {
      charset = "abcdefghijklmnopqrstuvwxyz";
    }

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    
    setPassword(result);
    setCopied(false);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const copyToClipboard = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUsePassword = () => {
    if (password && onSelect) {
      onSelect(password);
    }
  };

  // Generate initial password on mount
  useState(() => {
    generatePassword();
  });

  const strength = useMemo(
    () => calculateStrength(password, includeUppercase, includeLowercase, includeNumbers, includeSymbols),
    [password, includeUppercase, includeLowercase, includeNumbers, includeSymbols]
  );

  const strengthColors = {
    weak: "bg-destructive",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
    "very-strong": "bg-emerald-400",
  };

  const strengthIcons = {
    weak: ShieldAlert,
    medium: Shield,
    strong: ShieldCheck,
    "very-strong": ShieldCheck,
  };

  const StrengthIcon = strengthIcons[strength.level];

  return (
    <div className="space-y-4">
      {/* Generated Password Display */}
      <div className="relative">
        <div className="flex items-center gap-2 p-4 bg-secondary/50 rounded-xl border border-border">
          <Key className="h-4 w-4 text-muted-foreground shrink-0" />
          <code className="flex-1 font-mono text-sm text-foreground break-all">
            {password || "Click generate to create a password"}
          </code>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 w-8 p-0"
              disabled={!password}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={generatePassword}
              className="h-8 w-8 p-0"
            >
              <motion.div
                whileTap={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <RefreshCw className="h-4 w-4" />
              </motion.div>
            </Button>
          </div>
        </div>
      </div>

      {/* Strength Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StrengthIcon
              className={`h-4 w-4 ${
                strength.level === "weak"
                  ? "text-destructive"
                  : strength.level === "medium"
                  ? "text-yellow-500"
                  : "text-green-500"
              }`}
            />
            <span className="text-sm font-medium text-muted-foreground">Strength</span>
          </div>
          <span
            className={`text-sm font-semibold ${
              strength.level === "weak"
                ? "text-destructive"
                : strength.level === "medium"
                ? "text-yellow-500"
                : "text-green-500"
            }`}
          >
            {strength.label}
          </span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${strengthColors[strength.level]} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${strength.score}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Length Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Length</Label>
          <span className="text-sm font-mono text-foreground">{length}</span>
        </div>
        <Slider
          value={[length]}
          onValueChange={(value) => {
            setLength(value[0]);
            setTimeout(generatePassword, 0);
          }}
          min={8}
          max={64}
          step={1}
          className="w-full"
        />
      </div>

      {/* Character Options */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <Label htmlFor="uppercase" className="text-sm cursor-pointer">
            Uppercase (A-Z)
          </Label>
          <Switch
            id="uppercase"
            checked={includeUppercase}
            onCheckedChange={(checked) => {
              setIncludeUppercase(checked);
              setTimeout(generatePassword, 0);
            }}
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <Label htmlFor="lowercase" className="text-sm cursor-pointer">
            Lowercase (a-z)
          </Label>
          <Switch
            id="lowercase"
            checked={includeLowercase}
            onCheckedChange={(checked) => {
              setIncludeLowercase(checked);
              setTimeout(generatePassword, 0);
            }}
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <Label htmlFor="numbers" className="text-sm cursor-pointer">
            Numbers (0-9)
          </Label>
          <Switch
            id="numbers"
            checked={includeNumbers}
            onCheckedChange={(checked) => {
              setIncludeNumbers(checked);
              setTimeout(generatePassword, 0);
            }}
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <Label htmlFor="symbols" className="text-sm cursor-pointer">
            Symbols (!@#$%)
          </Label>
          <Switch
            id="symbols"
            checked={includeSymbols}
            onCheckedChange={(checked) => {
              setIncludeSymbols(checked);
              setTimeout(generatePassword, 0);
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      {onSelect && (
        <Button
          onClick={handleUsePassword}
          disabled={!password}
          className="w-full"
        >
          Use This Key
        </Button>
      )}
    </div>
  );
}
