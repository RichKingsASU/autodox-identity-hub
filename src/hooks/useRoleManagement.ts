import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ProfileWithRoles extends Profile {
  roles: AppRole[];
}

interface RoleStats {
  superAdminCount: number;
  adminCount: number;
  userCount: number;
}

export function useRoleManagement() {
  const { toast } = useToast();
  const [privilegedUsers, setPrivilegedUsers] = useState<ProfileWithRoles[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RoleStats>({
    superAdminCount: 0,
    adminCount: 0,
    userCount: 0,
  });

  const fetchRolesAndProfiles = async () => {
    setLoading(true);
    try {
      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, email");

      if (profilesError) throw profilesError;

      setAllProfiles(profiles || []);

      // Calculate stats
      const superAdmins = (roles || []).filter((r) => r.role === "super_admin");
      const admins = (roles || []).filter((r) => r.role === "admin");
      
      setStats({
        superAdminCount: superAdmins.length,
        adminCount: admins.length,
        userCount: (profiles || []).length - new Set([...superAdmins, ...admins].map((r) => r.user_id)).size,
      });

      // Get unique user IDs with elevated roles
      const elevatedUserIds = new Set(
        (roles || [])
          .filter((r) => r.role === "admin" || r.role === "super_admin")
          .map((r) => r.user_id)
      );

      // Map profiles to include their roles
      const usersWithRoles: ProfileWithRoles[] = (profiles || [])
        .filter((p) => elevatedUserIds.has(p.user_id))
        .map((profile) => ({
          ...profile,
          roles: (roles || [])
            .filter((r) => r.user_id === profile.user_id)
            .map((r) => r.role),
        }));

      setPrivilegedUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user roles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndProfiles();
  }, []);

  const grantRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast({
        title: "Role granted",
        description: `Successfully granted ${role} role.`,
      });

      await fetchRolesAndProfiles();
    } catch (error: any) {
      console.error("Error granting role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to grant role.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const revokeRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      toast({
        title: "Role revoked",
        description: `Successfully revoked ${role} role.`,
      });

      await fetchRolesAndProfiles();
    } catch (error: any) {
      console.error("Error revoking role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to revoke role.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    privilegedUsers,
    allProfiles,
    loading,
    stats,
    grantRole,
    revokeRole,
    refetch: fetchRolesAndProfiles,
  };
}
