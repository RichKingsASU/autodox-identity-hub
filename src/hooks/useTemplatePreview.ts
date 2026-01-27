import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LandingTemplate } from "@/types/templates";

export function useTemplatePreview(templateId: string | null) {
  return useQuery({
    queryKey: ["template-preview", templateId],
    queryFn: async (): Promise<LandingTemplate | null> => {
      if (!templateId) return null;

      const { data, error } = await supabase
        .from("landing_templates")
        .select("*")
        .eq("id", templateId)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch template:", error);
        throw error;
      }

      return data as unknown as LandingTemplate;
    },
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
