import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type BrandStatus = "provisioning" | "active" | "suspended" | "archived";
type DomainStatus = "pending" | "verifying" | "verified" | "provisioning_ssl" | "active" | "failed";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: BrandStatus;
  owner_user_id: string | null;
  settings: unknown;
  monthly_sms_limit: number;
  current_month_usage: number;
  created_at: string;
  updated_at: string;
  // Domain management fields
  domain_status: DomainStatus | null;
  domain_verification_token: string | null;
  domain_verified_at: string | null;
  ssl_status: string | null;
  cloudflare_hostname_id: string | null;
  domain_error: string | null;
  // Template fields
  active_template_id: string | null;
  applied_template_version: number | null;
  template_applied_at: string | null;
  previous_template_id: string | null;
  previous_template_version: number | null;
  // Joined template info
  active_template?: {
    id: string;
    name: string;
    version: number;
  } | null;
}

export interface CreateBrandData {
  name: string;
  slug: string;
  domain?: string;
  monthly_sms_limit?: number;
}

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await supabase
      .from("brands")
      .select(`
        *,
        landing_templates:active_template_id (
          id,
          name,
          version
        )
      `)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      toast.error("Failed to fetch brands");
    } else {
      // Transform data to include active_template
      const brandsWithTemplate = (data || []).map((brand: any) => ({
        ...brand,
        active_template: brand.landing_templates || null,
      }));
      setBrands(brandsWithTemplate as Brand[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const createBrand = async (brandData: CreateBrandData): Promise<Brand | null> => {
    const { data, error: createError } = await supabase
      .from("brands")
      .insert({
        name: brandData.name,
        slug: brandData.slug.toLowerCase().replace(/\s+/g, "-"),
        domain: brandData.domain || null,
        monthly_sms_limit: brandData.monthly_sms_limit || 10000,
        status: "provisioning" as BrandStatus,
      })
      .select()
      .single();

    if (createError) {
      toast.error(`Failed to create brand: ${createError.message}`);
      return null;
    }

    toast.success("Brand created successfully");
    await fetchBrands();
    return data as Brand;
  };

  const updateBrandStatus = async (brandId: string, status: BrandStatus): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from("brands")
      .update({ status })
      .eq("id", brandId);

    if (updateError) {
      toast.error(`Failed to update status: ${updateError.message}`);
      return false;
    }

    toast.success(`Brand status updated to ${status}`);
    await fetchBrands();
    return true;
  };

  const updateBrand = async (brandId: string, updates: Partial<Pick<Brand, "name" | "slug" | "domain" | "monthly_sms_limit">>): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from("brands")
      .update(updates)
      .eq("id", brandId);

    if (updateError) {
      toast.error(`Failed to update brand: ${updateError.message}`);
      return false;
    }

    toast.success("Brand updated successfully");
    await fetchBrands();
    return true;
  };

  const deleteBrand = async (brandId: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from("brands")
      .delete()
      .eq("id", brandId);

    if (deleteError) {
      toast.error(`Failed to delete brand: ${deleteError.message}`);
      return false;
    }

    toast.success("Brand deleted successfully");
    await fetchBrands();
    return true;
  };

  return {
    brands,
    loading,
    error,
    fetchBrands,
    createBrand,
    updateBrandStatus,
    updateBrand,
    deleteBrand,
  };
}
