import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PortalConfig {
  id: string;
  user_id: string;
  brand_name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortalConfigWithUser extends PortalConfig {
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Hook for fetching current user's portal config
export function usePortalConfig() {
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Use any to bypass type checking until types sync
        const { data, error } = await (supabase as any)
          .from("portal_configs")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setConfig(data as PortalConfig | null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { config, loading, error };
}

// Hook for admin to manage all portal configs
export function useAllPortalConfigs() {
  const [configs, setConfigs] = useState<PortalConfigWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      // Use any to bypass type checking until types sync
      const { data, error } = await (supabase as any)
        .from("portal_configs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately to avoid join issues before types sync
      const configsWithProfiles: PortalConfigWithUser[] = [];
      const rawConfigs = (data || []) as PortalConfig[];
      for (const config of rawConfigs) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("user_id", config.user_id)
          .maybeSingle();
        
        configsWithProfiles.push({
          ...config,
          profiles: profileData || undefined,
        } as PortalConfigWithUser);
      }
      
      setConfigs(configsWithProfiles);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const createConfig = async (
    userId: string,
    configData: Partial<Omit<PortalConfig, "id" | "user_id" | "created_at" | "updated_at">>
  ) => {
    try {
      // Use any to bypass type checking until types sync
      const { data, error } = await (supabase as any)
        .from("portal_configs")
        .insert({
          user_id: userId,
          brand_name: configData.brand_name || "My Portal",
          primary_color: configData.primary_color || "#8B5CF6",
          secondary_color: configData.secondary_color || "#EC4899",
          logo_url: configData.logo_url || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Portal configured",
        description: "The user's portal has been set up successfully.",
      });

      await fetchConfigs();
      return data as PortalConfig;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error creating config",
        description: (err as Error).message,
      });
      throw err;
    }
  };

  const updateConfig = async (
    configId: string,
    updates: Partial<Omit<PortalConfig, "id" | "user_id" | "created_at" | "updated_at">>
  ) => {
    try {
      // Use any to bypass type checking until types sync
      const { data, error } = await (supabase as any)
        .from("portal_configs")
        .update(updates)
        .eq("id", configId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Portal updated",
        description: "The portal configuration has been saved.",
      });

      await fetchConfigs();
      return data as PortalConfig;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error updating config",
        description: (err as Error).message,
      });
      throw err;
    }
  };

  const deleteConfig = async (configId: string) => {
    try {
      // Use any to bypass type checking until types sync
      const { error } = await (supabase as any)
        .from("portal_configs")
        .delete()
        .eq("id", configId);

      if (error) throw error;

      toast({
        title: "Portal config deleted",
        description: "The configuration has been removed.",
      });

      await fetchConfigs();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error deleting config",
        description: (err as Error).message,
      });
      throw err;
    }
  };

  return {
    configs,
    loading,
    error,
    refetch: fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
  };
}

// Fetch all profiles for admin (to show users without configs)
export function useAllProfiles() {
  const [profiles, setProfiles] = useState<Array<{
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, user_id, first_name, last_name, email")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProfiles(data || []);
      } catch (err) {
        console.error("Error fetching profiles:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  return { profiles, loading };
}
