import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplates } from "@/hooks/useTemplates";
import { useAuth } from "@/hooks/useAuth";
import { TemplatesTable } from "@/components/admin/templates/TemplatesTable";
import { TemplatePreviewModal } from "@/components/admin/templates/TemplatePreviewModal";
import { TemplateEditorModal } from "@/components/admin/templates/TemplateEditorModal";
import { ApplyTemplateToBrandModal } from "@/components/admin/templates/ApplyTemplateToBrandModal";
import { TemplateActivityLogViewer } from "@/components/admin/templates/TemplateActivityLogViewer";
import { LayoutGrid, History } from "lucide-react";
import type { 
  LandingTemplateListItem, 
  LandingBaseLayout, 
  TemplateStatus,
  TemplateActivityLog,
  DefaultCopy,
  ThemeOverrides
} from "@/types/templates";

export default function AdminTemplates() {
  const { user } = useAuth();
  const { 
    templates, 
    loading, 
    fetchTemplates, 
    updateTemplate,
    toggleTemplateStatus,
    applyTemplateToBrand,
    fetchActivityLog,
    logTemplateChange
  } = useTemplates();

  const [selectedTemplate, setSelectedTemplate] = useState<LandingTemplateListItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<TemplateActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Filters state
  const [search, setSearch] = useState("");
  const [layoutFilter, setLayoutFilter] = useState<LandingBaseLayout | undefined>();
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | undefined>();

  // Load templates on mount and filter change
  useEffect(() => {
    fetchTemplates({ search, baseLayout: layoutFilter, status: statusFilter });
  }, [fetchTemplates, search, layoutFilter, statusFilter]);

  // Load activity logs
  const loadActivityLogs = useCallback(async () => {
    setLogsLoading(true);
    const logs = await fetchActivityLog();
    setActivityLogs(logs);
    setLogsLoading(false);
  }, [fetchActivityLog]);

  const handlePreview = (template: LandingTemplateListItem) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleEdit = (template: LandingTemplateListItem) => {
    setSelectedTemplate(template);
    setEditorOpen(true);
  };

  const handleApply = (template: LandingTemplateListItem) => {
    setSelectedTemplate(template);
    setApplyOpen(true);
  };

  const handleToggleStatus = async (template: LandingTemplateListItem) => {
    const newStatus: TemplateStatus = template.status === "published" ? "disabled" : "published";
    const success = await toggleTemplateStatus(template.id, newStatus);
    if (success && user) {
      await logTemplateChange(
        template.id,
        template.slug,
        newStatus === "published" ? "published" : "disabled",
        { previous_status: template.status, new_status: newStatus },
        user.id
      );
      fetchTemplates({ search, baseLayout: layoutFilter, status: statusFilter });
    }
  };

  const handleSave = async (
    templateId: string, 
    updates: { default_copy?: DefaultCopy; default_theme_overrides?: ThemeOverrides }
  ): Promise<boolean> => {
    const success = await updateTemplate(templateId, updates);
    if (success && user && selectedTemplate) {
      await logTemplateChange(
        templateId,
        selectedTemplate.slug,
        "updated",
        { updated_fields: Object.keys(updates) },
        user.id
      );
      fetchTemplates({ search, baseLayout: layoutFilter, status: statusFilter });
    }
    return success;
  };

  const handleStatusChange = async (templateId: string, status: TemplateStatus): Promise<boolean> => {
    const success = await toggleTemplateStatus(templateId, status);
    if (success && user && selectedTemplate) {
      await logTemplateChange(
        templateId,
        selectedTemplate.slug,
        status === "published" ? "published" : "disabled",
        { new_status: status },
        user.id
      );
      fetchTemplates({ search, baseLayout: layoutFilter, status: statusFilter });
    }
    return success;
  };

  const handleApplyTemplate = async (templateId: string, brandId: string, templateVersion: number): Promise<boolean> => {
    if (!user) return false;
    return applyTemplateToBrand(templateId, brandId, templateVersion, user.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Template Management</h1>
        <p className="text-muted-foreground">Manage landing page templates for brand deployments</p>
      </div>

      <Tabs defaultValue="templates" onValueChange={(v) => v === "activity" && loadActivityLogs()}>
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <History className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <TemplatesTable
            templates={templates}
            loading={loading}
            onPreview={handlePreview}
            onEdit={handleEdit}
            onApply={handleApply}
            onToggleStatus={handleToggleStatus}
            onSearch={setSearch}
            onFilterLayout={setLayoutFilter}
            onFilterStatus={setStatusFilter}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <TemplateActivityLogViewer logs={activityLogs} loading={logsLoading} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TemplatePreviewModal
        template={selectedTemplate}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      <TemplateEditorModal
        template={selectedTemplate}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onStatusChange={handleStatusChange}
      />

      <ApplyTemplateToBrandModal
        template={selectedTemplate}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onApply={handleApplyTemplate}
      />
    </div>
  );
}
