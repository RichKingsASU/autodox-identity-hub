import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ApplicationWithProfile {
  id: string;
  user_id: string;
  company_name: string;
  ein: string;
  use_case: string;
  monthly_volume: string;
  tos_url: string;
  privacy_url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export function useApplications() {
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch applications
      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (appsError) throw appsError;

      // Fetch profiles separately and match by user_id
      const userIds = appsData?.map((app) => app.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .in("user_id", userIds);

      const profilesMap = new Map(
        profilesData?.map((p) => [p.user_id, p]) || []
      );

      const combinedData = appsData?.map((app) => ({
        ...app,
        profiles: profilesMap.get(app.user_id) || null,
      })) as ApplicationWithProfile[];

      setApplications(combinedData || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateApplicationStatus = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status } : app))
      );

      toast({
        title: "Success",
        description: `Application ${status}`,
      });

      return true;
    } catch (error) {
      console.error("Error updating application:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Computed stats
  const stats = {
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    total: applications.length,
  };

  return {
    applications,
    loading,
    stats,
    fetchApplications,
    updateApplicationStatus,
  };
}
