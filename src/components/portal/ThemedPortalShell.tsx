import { useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import { LogOut, Home, Settings, FileText, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalConfig } from "@/hooks/usePortalConfig";

interface ThemedPortalShellProps {
  config: PortalConfig | null;
  userName: string;
  onSignOut: () => void;
  children?: ReactNode;
}

// Inject CSS variables for theming
function applyTheme(config: PortalConfig | null) {
  const root = document.documentElement;
  const primary = config?.primary_color || "#8B5CF6";
  const secondary = config?.secondary_color || "#EC4899";

  root.style.setProperty("--portal-primary", primary);
  root.style.setProperty("--portal-secondary", secondary);
  
  // Convert hex to HSL for Tailwind compatibility
  const hexToHsl = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "0 0% 50%";
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  root.style.setProperty("--portal-primary-hsl", hexToHsl(primary));
  root.style.setProperty("--portal-secondary-hsl", hexToHsl(secondary));
}

export function ThemedPortalShell({
  config,
  userName,
  onSignOut,
  children,
}: ThemedPortalShellProps) {
  // Apply theme on mount and when config changes
  useEffect(() => {
    applyTheme(config);
    return () => {
      // Reset on unmount
      document.documentElement.style.removeProperty("--portal-primary");
      document.documentElement.style.removeProperty("--portal-secondary");
      document.documentElement.style.removeProperty("--portal-primary-hsl");
      document.documentElement.style.removeProperty("--portal-secondary-hsl");
    };
  }, [config]);

  const brandName = config?.brand_name || "My Portal";
  const logoUrl = config?.logo_url;
  const primaryColor = config?.primary_color || "#8B5CF6";
  const secondaryColor = config?.secondary_color || "#EC4899";

  return (
    <div className="min-h-screen bg-background">
      {/* Header with gradient */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-border backdrop-blur-xl"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10)`,
        }}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <motion.img
                src={logoUrl}
                alt={brandName}
                className="h-9 w-9 rounded-lg object-contain"
                style={{
                  boxShadow: `0 0 20px ${primaryColor}40`,
                }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              />
            ) : (
              <motion.div
                className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                {brandName.charAt(0).toUpperCase()}
              </motion.div>
            )}
            <span
              className="text-xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {brandName}
            </span>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Welcome, <span className="font-medium text-foreground">{userName}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}

// Themed stat card component
export function ThemedStatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-6"
      style={{
        boxShadow: `0 4px 20px -5px var(--portal-primary, #8B5CF6)20`,
      }}
    >
      {/* Gradient accent */}
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full blur-2xl"
        style={{
          background: `linear-gradient(135deg, var(--portal-primary, #8B5CF6), var(--portal-secondary, #EC4899))`,
        }}
      />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {trend && (
            <p
              className={`text-xs mt-2 ${
                trend.positive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{
            background: `linear-gradient(135deg, var(--portal-primary, #8B5CF6)20, var(--portal-secondary, #EC4899)10)`,
          }}
        >
          <Icon
            className="h-5 w-5"
            style={{ color: "var(--portal-primary, #8B5CF6)" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Themed button component
export function ThemedButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}) {
  const baseStyles = "px-6 py-2.5 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]";
  
  const variantStyles = {
    primary: "text-white",
    secondary: "",
    outline: "border",
  };

  const getInlineStyles = () => {
    switch (variant) {
      case "primary":
        return {
          background: `linear-gradient(135deg, var(--portal-primary, #8B5CF6), var(--portal-secondary, #EC4899))`,
        };
      case "secondary":
        return {
          background: `var(--portal-primary, #8B5CF6)20`,
          color: "var(--portal-primary, #8B5CF6)",
        };
      case "outline":
        return {
          borderColor: `var(--portal-primary, #8B5CF6)40`,
          color: "var(--portal-primary, #8B5CF6)",
        };
      default:
        return {};
    }
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={getInlineStyles()}
      {...props}
    >
      {children}
    </button>
  );
}
