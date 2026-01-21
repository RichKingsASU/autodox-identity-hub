import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

export interface ProfileWithRoles extends Profile {
  roles: AppRole[];
}

export function useProfiles() {
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async (): Promise<ProfileWithRoles[]> => {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Create a map of user_id to roles
      const rolesMap = new Map<string, AppRole[]>();
      userRoles?.forEach((ur) => {
        const existing = rolesMap.get(ur.user_id) || [];
        existing.push(ur.role);
        rolesMap.set(ur.user_id, existing);
      });

      // Combine profiles with their roles
      return (profiles || []).map((profile) => ({
        ...profile,
        roles: rolesMap.get(profile.user_id) || ["user" as AppRole],
      }));
    },
  });
}
