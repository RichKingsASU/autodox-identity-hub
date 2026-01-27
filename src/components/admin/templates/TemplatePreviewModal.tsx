import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTemplatePreview } from "@/hooks/useTemplatePreview";
import { LayoutRenderer, layoutDisplayNames } from "@/components/landing/layouts/LayoutRenderer";
import type { LandingTemplateListItem } from "@/types/templates";

interface TemplatePreviewModalProps {
  template: LandingTemplateListItem | null;
  open: boolean;
  onClose: () => void;
}

export function TemplatePreviewModal({ template, open, onClose }: TemplatePreviewModalProps) {
  const { data: fullTemplate, isLoading } = useTemplatePreview(template?.id || null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 bg-background">
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-lg font-semibold">
                {template?.name || "Template Preview"}
              </DialogTitle>
              {template && (
                <>
                  <Badge variant="secondary">
                    {layoutDisplayNames[template.base_layout]}
                  </Badge>
                  <span className="font-mono text-sm text-muted-foreground">
                    v{template.version}
                  </span>
                </>
              )}
            </div>
            {template && (
              <code className="text-xs text-muted-foreground font-mono">
                {template.slug}
              </code>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : fullTemplate ? (
            <LayoutRenderer
              baseLayout={fullTemplate.base_layout}
              copy={fullTemplate.default_copy}
              theme={fullTemplate.default_theme_overrides}
              sectionsEnabled={fullTemplate.sections_enabled}
              previewMode={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No template selected
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
