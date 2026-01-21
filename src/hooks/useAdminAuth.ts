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

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
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
