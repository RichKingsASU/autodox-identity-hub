import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type DomainStatus = "pending" | "verifying" | "verified" | "provisioning_ssl" | "active" | "failed";

interface DomainState {
  status: DomainStatus | null;
  verificationToken: string | null;
  error: string | null;
  verifiedAt: string | null;
  sslStatus: string | null;
}

export function useDomainVerification(brandId: string) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [domainState, setDomainState] = useState<DomainState>({
    status: null,
    verificationToken: null,
    error: null,
    verifiedAt: null,
    sslStatus: null,
  });

  const fetchDomainStatus = useCallback(async () => {
    const { data, error } = await supabase
      .from("brands")
      .select("domain, domain_status, domain_verification_token, domain_error, domain_verified_at, ssl_status")
      .eq("id", brandId)
      .single();

    if (error) {
      console.error("Failed to fetch domain status:", error);
      return null;
    }

    setDomainState({
      status: data.domain_status as DomainStatus | null,
      verificationToken: data.domain_verification_token,
      error: data.domain_error,
      verifiedAt: data.domain_verified_at,
      sslStatus: data.ssl_status,
    });

    return data;
  }, [brandId]);

  const initiateDomainSetup = async (domain: string): Promise<boolean> => {
    // Generate a verification token
    const token = `autodox_verify_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`;

    const { error } = await supabase
      .from("brands")
      .update({
        domain: domain.toLowerCase().trim(),
        domain_status: "pending" as DomainStatus,
        domain_verification_token: token,
        domain_error: null,
      })
      .eq("id", brandId);

    if (error) {
      toast.error(`Failed to set up domain: ${error.message}`);
      return false;
    }

    await fetchDomainStatus();
    toast.success("Domain configured. Add the DNS records to verify ownership.");
    return true;
  };

  const verifyDomain = async (): Promise<boolean> => {
    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: { brandId },
      });

      if (error) {
        toast.error(`Verification failed: ${error.message}`);
        setIsVerifying(false);
        return false;
      }

      if (data.verified) {
        toast.success("Domain ownership verified!");
        await fetchDomainStatus();
        setIsVerifying(false);
        return true;
      } else {
        toast.error(data.message || "DNS verification failed. Please check your TXT record.");
        await fetchDomainStatus();
        setIsVerifying(false);
        return false;
      }
    } catch (err) {
      toast.error("Failed to verify domain");
      setIsVerifying(false);
      return false;
    }
  };

  const provisionSSL = async (): Promise<boolean> => {
    setIsProvisioning(true);

    try {
      const { data, error } = await supabase.functions.invoke("provision-ssl", {
        body: { brandId },
      });

      if (error) {
        toast.error(`SSL provisioning failed: ${error.message}`);
        setIsProvisioning(false);
        return false;
      }

      if (data.success) {
        toast.success("SSL certificate provisioning started!");
        await fetchDomainStatus();
        setIsProvisioning(false);
        return true;
      } else {
        toast.error(data.message || "Failed to provision SSL certificate.");
        await fetchDomainStatus();
        setIsProvisioning(false);
        return false;
      }
    } catch (err) {
      toast.error("Failed to provision SSL");
      setIsProvisioning(false);
      return false;
    }
  };

  const checkStatus = async (): Promise<DomainStatus | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("check-domain-status", {
        body: { brandId },
      });

      if (error) {
        console.error("Failed to check domain status:", error);
        return null;
      }

      await fetchDomainStatus();
      return data.status as DomainStatus;
    } catch (err) {
      console.error("Failed to check domain status:", err);
      return null;
    }
  };

  const removeDomain = async (): Promise<boolean> => {
    const { error } = await supabase
      .from("brands")
      .update({
        domain: null,
        domain_status: null,
        domain_verification_token: null,
        domain_verified_at: null,
        domain_error: null,
        ssl_status: null,
        cloudflare_hostname_id: null,
      })
      .eq("id", brandId);

    if (error) {
      toast.error(`Failed to remove domain: ${error.message}`);
      return false;
    }

    setDomainState({
      status: null,
      verificationToken: null,
      error: null,
      verifiedAt: null,
      sslStatus: null,
    });

    toast.success("Domain removed");
    return true;
  };

  return {
    domainState,
    isVerifying,
    isProvisioning,
    fetchDomainStatus,
    initiateDomainSetup,
    verifyDomain,
    provisionSSL,
    checkStatus,
    removeDomain,
  };
}
