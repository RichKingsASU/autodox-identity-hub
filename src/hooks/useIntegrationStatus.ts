import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type IntegrationStatus = "connected" | "disconnected" | "warning" | "checking";

export interface IntegrationInfo {
  name: string;
  status: IntegrationStatus;
  message: string;
  detail?: string;
  lastChecked: Date | null;
}

export interface IntegrationStatusState {
  netlify: IntegrationInfo;
  resend: IntegrationInfo;
  database: IntegrationInfo;
  isLoading: boolean;
}

const defaultState: IntegrationStatusState = {
  netlify: {
    name: "Netlify",
    status: "checking",
    message: "Checking...",
    lastChecked: null,
  },
  resend: {
    name: "Email (Resend)",
    status: "checking",
    message: "Checking...",
    lastChecked: null,
  },
  database: {
    name: "Database",
    status: "checking",
    message: "Checking...",
    lastChecked: null,
  },
  isLoading: true,
};

export function useIntegrationStatus(autoRefresh = false, refreshInterval = 60000) {
  const [status, setStatus] = useState<IntegrationStatusState>(defaultState);

  const checkNetlify = useCallback(async (): Promise<IntegrationInfo> => {
    try {
      const { data, error } = await supabase.functions.invoke("netlify-health-check");
      
      if (error) {
        return {
          name: "Netlify",
          status: "disconnected",
          message: "Connection failed",
          detail: error.message,
          lastChecked: new Date(),
        };
      }

      if (data?.connected) {
        return {
          name: "Netlify",
          status: "connected",
          message: "Connected",
          detail: data.site_name || "identitybrandhub",
          lastChecked: new Date(),
        };
      }

      return {
        name: "Netlify",
        status: data?.status === "not_configured" ? "warning" : "disconnected",
        message: data?.message || "Not connected",
        lastChecked: new Date(),
      };
    } catch (err) {
      return {
        name: "Netlify",
        status: "disconnected",
        message: "Connection error",
        detail: err instanceof Error ? err.message : "Unknown error",
        lastChecked: new Date(),
      };
    }
  }, []);

  const checkResend = useCallback(async (): Promise<IntegrationInfo> => {
    try {
      const { data, error } = await supabase.functions.invoke("resend-health-check");
      
      if (error) {
        return {
          name: "Email (Resend)",
          status: "disconnected",
          message: "Connection failed",
          detail: error.message,
          lastChecked: new Date(),
        };
      }

      if (data?.connected) {
        return {
          name: "Email (Resend)",
          status: "connected",
          message: "API Key configured",
          detail: "Resend API operational",
          lastChecked: new Date(),
        };
      }

      return {
        name: "Email (Resend)",
        status: data?.status === "not_configured" ? "warning" : "disconnected",
        message: data?.message || "Not configured",
        lastChecked: new Date(),
      };
    } catch (err) {
      return {
        name: "Email (Resend)",
        status: "disconnected",
        message: "Connection error",
        detail: err instanceof Error ? err.message : "Unknown error",
        lastChecked: new Date(),
      };
    }
  }, []);

  const checkDatabase = useCallback(async (): Promise<IntegrationInfo> => {
    try {
      // Simple query to verify database connectivity
      const { error } = await supabase.from("brands").select("id").limit(1);
      
      if (error) {
        return {
          name: "Database",
          status: "disconnected",
          message: "Connection failed",
          detail: error.message,
          lastChecked: new Date(),
        };
      }

      return {
        name: "Database",
        status: "connected",
        message: "Connected",
        detail: "Cloud Backend",
        lastChecked: new Date(),
      };
    } catch (err) {
      return {
        name: "Database",
        status: "disconnected",
        message: "Connection error",
        detail: err instanceof Error ? err.message : "Unknown error",
        lastChecked: new Date(),
      };
    }
  }, []);

  const checkAllIntegrations = useCallback(async () => {
    setStatus((prev) => ({ ...prev, isLoading: true }));

    const [netlify, resend, database] = await Promise.all([
      checkNetlify(),
      checkResend(),
      checkDatabase(),
    ]);

    setStatus({
      netlify,
      resend,
      database,
      isLoading: false,
    });
  }, [checkNetlify, checkResend, checkDatabase]);

  // Initial check
  useEffect(() => {
    checkAllIntegrations();
  }, [checkAllIntegrations]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(checkAllIntegrations, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, checkAllIntegrations]);

  return {
    ...status,
    refresh: checkAllIntegrations,
  };
}
