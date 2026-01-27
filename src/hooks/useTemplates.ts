import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  LandingTemplate, 
  LandingTemplateListItem, 
  TemplateFilters, 
  TemplateStatus,
  TemplateActivityLog,
  ActivityLogFilters,
  LandingBaseLayout
} from "@/types/templates";
import type { Json } from "@/integrations/supabase/types";

export function useTemplates() {
  const [templates, setTemplates] = useState<LandingTemplateListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch templates list (metadata only, no JSONB)
  const fetchTemplates = useCallback(async (filters?: TemplateFilters) => {
    setLoading(true);
    
    let query = supabase
      .from("landing_templates")
      .select("id, name, slug, category, base_layout, version, status, created_at, updated_at", { count: "exact" })
      .order("updated_at", { ascending: false });

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
    }
    
    if (filters?.baseLayout) {
      query = query.eq("base_layout", filters.baseLayout);
    }
    
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const page = filters?.page || 1;
    const perPage = filters?.perPage || 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      toast.error("Failed to fetch templates");
      console.error(error);
    } else {
      setTemplates(data as LandingTemplateListItem[]);
      setTotalCount(count || 0);
    }
    
    setLoading(false);
    return data as LandingTemplateListItem[];
  }, []);

  // Get full template by ID (includes JSONB fields)
  const getTemplateById = async (id: string): Promise<LandingTemplate | null> => {
    const { data, error } = await supabase
      .from("landing_templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      toast.error("Failed to fetch template");
      console.error(error);
      return null;
    }

    return data as unknown as LandingTemplate;
  };

  // Update template (triggers version increment)
  const updateTemplate = async (
    id: string, 
    updates: Partial<Pick<LandingTemplate, "default_copy" | "default_theme_overrides">>
  ): Promise<boolean> => {
    // Convert to Json-compatible format
    const dbUpdates: Record<string, Json> = {};
    if (updates.default_copy) {
      dbUpdates.default_copy = updates.default_copy as unknown as Json;
    }
    if (updates.default_theme_overrides) {
      dbUpdates.default_theme_overrides = updates.default_theme_overrides as unknown as Json;
    }

    const { error } = await supabase
      .from("landing_templates")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update template");
      console.error(error);
      return false;
    }

    toast.success("Template updated successfully");
    return true;
  };

  // Toggle template status
  const toggleTemplateStatus = async (id: string, status: TemplateStatus): Promise<boolean> => {
    const { error } = await supabase
      .from("landing_templates")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update template status");
      console.error(error);
      return false;
    }

    const action = status === "published" ? "published" : status === "disabled" ? "disabled" : "set to draft";
    toast.success(`Template ${action}`);
    return true;
  };

  // Apply template to brand
  const applyTemplateToBrand = async (
    templateId: string, 
    brandId: string, 
    templateVersion: number,
    adminUserId: string
  ): Promise<boolean> => {
    // First get current brand state for rollback capability
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("active_template_id, applied_template_version")
      .eq("id", brandId)
      .maybeSingle();

    if (brandError) {
      toast.error("Failed to fetch brand");
      return false;
    }

    // Get template info for logging
    const { data: template, error: templateError } = await supabase
      .from("landing_templates")
      .select("slug")
      .eq("id", templateId)
      .maybeSingle();

    if (templateError || !template) {
      toast.error("Failed to fetch template");
      return false;
    }

    // Update brand with new template
    const { error: updateError } = await supabase
      .from("brands")
      .update({
        active_template_id: templateId,
        applied_template_version: templateVersion,
        template_applied_at: new Date().toISOString(),
        template_applied_by: adminUserId,
        previous_template_id: brand?.active_template_id || null,
        previous_template_version: brand?.applied_template_version || null,
      })
      .eq("id", brandId);

    if (updateError) {
      toast.error("Failed to apply template to brand");
      console.error(updateError);
      return false;
    }

    // Log the action
    await supabase
      .from("template_activity_log")
      .insert({
        template_id: templateId,
        template_slug: template.slug,
        brand_id: brandId,
        action: "applied",
        changes: { 
          previous_template_id: brand?.active_template_id,
          new_template_id: templateId,
          version: templateVersion
        },
        performed_by: adminUserId,
      });

    toast.success("Template applied to brand");
    return true;
  };

  // Revert brand to previous template
  const revertBrandTemplate = async (brandId: string, adminUserId: string): Promise<boolean> => {
    // Get current brand state
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("active_template_id, applied_template_version, previous_template_id, previous_template_version")
      .eq("id", brandId)
      .maybeSingle();

    if (brandError || !brand?.previous_template_id) {
      toast.error("No previous template to revert to");
      return false;
    }

    // Get template slug for logging
    const { data: template } = await supabase
      .from("landing_templates")
      .select("slug")
      .eq("id", brand.previous_template_id)
      .maybeSingle();

    // Swap current and previous
    const { error: updateError } = await supabase
      .from("brands")
      .update({
        active_template_id: brand.previous_template_id,
        applied_template_version: brand.previous_template_version,
        template_applied_at: new Date().toISOString(),
        template_applied_by: adminUserId,
        previous_template_id: brand.active_template_id,
        previous_template_version: brand.applied_template_version,
      })
      .eq("id", brandId);

    if (updateError) {
      toast.error("Failed to revert template");
      console.error(updateError);
      return false;
    }

    // Log the action
    await supabase
      .from("template_activity_log")
      .insert({
        template_id: brand.previous_template_id,
        template_slug: template?.slug || "unknown",
        brand_id: brandId,
        action: "reverted",
        changes: { 
          reverted_from_template_id: brand.active_template_id,
          reverted_to_template_id: brand.previous_template_id
        },
        performed_by: adminUserId,
      });

    toast.success("Template reverted successfully");
    return true;
  };

  // Fetch activity log
  const fetchActivityLog = async (filters?: ActivityLogFilters): Promise<TemplateActivityLog[]> => {
    let query = supabase
      .from("template_activity_log")
      .select("*")
      .order("performed_at", { ascending: false });

    if (filters?.templateId) {
      query = query.eq("template_id", filters.templateId);
    }

    if (filters?.action) {
      query = query.eq("action", filters.action);
    }

    if (filters?.startDate) {
      query = query.gte("performed_at", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("performed_at", filters.endDate);
    }

    const page = filters?.page || 1;
    const perPage = filters?.perPage || 50;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to fetch activity log");
      console.error(error);
      return [];
    }

    return data as TemplateActivityLog[];
  };

  // Log template change (for editor)
  const logTemplateChange = async (
    templateId: string,
    templateSlug: string,
    action: string,
    changes: Record<string, unknown>,
    adminUserId: string
  ): Promise<void> => {
    await supabase
      .from("template_activity_log")
      .insert([{
        template_id: templateId,
        template_slug: templateSlug,
        action,
        changes: changes as Json,
        performed_by: adminUserId,
      }]);
  };

  return {
    templates,
    loading,
    totalCount,
    fetchTemplates,
    getTemplateById,
    updateTemplate,
    toggleTemplateStatus,
    applyTemplateToBrand,
    revertBrandTemplate,
    fetchActivityLog,
    logTemplateChange,
  };
}
