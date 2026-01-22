import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Users,
  Key,
  BarChart3,
  CreditCard,
  Puzzle,
  LifeBuoy,
  Settings,
  Lock,
  LogOut,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut?: () => void;
}

const menuItems = [
  { label: "Overview", icon: Home, path: "/dashboard", locked: false },
  { label: "Contacts", icon: Users, path: "/dashboard/contacts", locked: true },
  { label: "API Keys", icon: Key, path: "/dashboard/api-keys", locked: true },
  { label: "Analytics", icon: BarChart3, path: "/dashboard/analytics", locked: true },
  { label: "Billing", icon: CreditCard, path: "/dashboard/billing", locked: true },
  { label: "Integrations", icon: Puzzle, path: "/dashboard/integrations", locked: true },
  { label: "Support", icon: LifeBuoy, path: "/dashboard/support", locked: false },
  { label: "Settings", icon: Settings, path: "/dashboard/settings", locked: false },
];

export function DashboardSidebar({ isOpen, onClose, onSignOut }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, application } = useAuth();

  const isApproved = application?.status === "approved";
  const userInitials = profile
    ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`
    : "U";

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-[280px] z-50 flex flex-col",
          "bg-[hsl(217_33%_17%)] border-r border-border",
          "transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Autodox</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status Badge & CTA */}
        {!isApproved && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm font-medium text-orange-400">
                Status: Application Required
              </span>
            </div>
            <Button
              onClick={() => handleNavigation("/application")}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold"
            >
              Complete Application
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const showLock = item.locked && !isApproved;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1 font-medium">{item.label}</span>
                {showLock && (
                  <Lock className="h-4 w-4 text-muted-foreground/50" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <Avatar className="h-10 w-10 border-2 border-primary/30">
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="w-full mt-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
