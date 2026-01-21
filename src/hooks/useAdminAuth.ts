import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "super_admin" | "user";

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

// DEV BYPASS: Set to true to skip authentication in development
const DEV_BYPASS = import.meta.env.DEV && true;

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // DEV BYPASS: Skip auth in development
    if (DEV_BYPASS) {
      setUser({ id: "dev-user", email: "dev@autodox.com" } as User);
      setRoles(["super_admin"]);
      setIsAdmin(true);
      setIsSuperAdmin(true);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user roles
          setTimeout(async () => {
            const { data: userRoles } = await supabase
              .from("user_roles")
              .select("*")
              .eq("user_id", session.user.id);
            
            if (userRoles) {
              const roleList = userRoles.map((r: UserRole) => r.role);
              setRoles(roleList);
              setIsAdmin(roleList.includes("admin") || roleList.includes("super_admin"));
              setIsSuperAdmin(roleList.includes("super_admin"));
            }
            setLoading(false);
          }, 0);
        } else {
          setRoles([]);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    roles,
    loading,
    isAdmin,
    isSuperAdmin,
  };
}
