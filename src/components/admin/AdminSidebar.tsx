import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AdminSidebarProps {
  isSuperAdmin: boolean;
  onSignOut: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: Building2, label: "Brands", path: "/admin/brands" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const superAdminItems = [
  { icon: Shield, label: "Access Control", path: "/admin/access" },
];

export function AdminSidebar({ isSuperAdmin, onSignOut }: AdminSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const allItems = isSuperAdmin ? [...navItems, ...superAdminItems] : navItems;

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <span className="text-xl font-bold gradient-text">Autodox Admin</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {allItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/admin" && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={onSignOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
