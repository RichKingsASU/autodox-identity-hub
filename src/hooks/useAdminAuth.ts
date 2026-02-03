import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "super_admin" | "user";

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

// DEV BYPASS: Set to false for production, true only for local development testing
const DEV_BYPASS = false;

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Reusable function to fetch user roles
  const fetchUserRoles = useCallback(async (userId: string): Promise<AppRole[]> => {
    const { data: userRoles, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }

    return (userRoles as UserRole[])?.map((r) => r.role) ?? [];
  }, []);

  // Apply roles to state
  const applyRoles = useCallback((roleList: AppRole[]) => {
    setRoles(roleList);
    setIsAdmin(roleList.includes("admin") || roleList.includes("super_admin"));
    setIsSuperAdmin(roleList.includes("super_admin"));
  }, []);

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

    let isMounted = true;

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          const roleList = await fetchUserRoles(session.user.id);
          if (isMounted) {
            applyRoles(roleList);
            setLoading(false);
          }
        } else {
          applyRoles([]);
          setLoading(false);
        }
      }
    );

    // Initial session check - fetch roles before setting loading to false
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!isMounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        const roleList = await fetchUserRoles(session.user.id);
        if (isMounted) {
          applyRoles(roleList);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRoles, applyRoles]);

  return {
    user,
    roles,
    loading,
    isAdmin,
    isSuperAdmin,
  };
}
