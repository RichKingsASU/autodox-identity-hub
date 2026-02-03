import { useState, useEffect } from "react";
import { Building2, Globe, Settings, LayoutTemplate, RotateCcw, Calendar } from "lucide-react";
import { Brand } from "@/hooks/useBrands";
import { useTemplates } from "@/hooks/useTemplates";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandDomainTab } from "./BrandDomainTab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import type { LandingTemplateListItem } from "@/types/templates";

interface EditBrandModalProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (brandId: string, updates: Partial<Pick<Brand, "name" | "slug" | "domain" | "monthly_sms_limit">>) => Promise<boolean>;
  onRefresh: () => void;
}

export function EditBrandModal({ brand, isOpen, onClose, onSave, onRefresh }: EditBrandModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("10000");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [publishedTemplates, setPublishedTemplates] = useState<LandingTemplateListItem[]>([]);
  
  const { fetchTemplates, applyTemplateToBrand, revertBrandTemplate, getTemplateById } = useTemplates();
  const { user } = useAuth();

  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setSlug(brand.slug);
      setMonthlyLimit(brand.monthly_sms_limit.toString());
      setSelectedTemplateId(brand.active_template_id || "");
    }
  }, [brand]);

  // Fetch published templates when template tab is active
  useEffect(() => {
    if (activeTab === "template" && isOpen) {
      fetchTemplates({ status: "published", perPage: 100 }).then((templates) => {
        setPublishedTemplates(templates || []);
      });
    }
  }, [activeTab, isOpen, fetchTemplates]);

  const handleSave = async () => {
    if (!brand) return;

    setIsSaving(true);
    const success = await onSave(brand.id, {
      name,
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      monthly_sms_limit: parseInt(monthlyLimit) || 10000,
    });
    setIsSaving(false);

    if (success) {
      onClose();
    }
  };

  const handleDomainChange = () => {
    onRefresh();
  };

  const handleApplyTemplate = async () => {
    if (!brand || !selectedTemplateId || !user) return;
    
    setIsApplying(true);
    
    // Get template version
    const template = await getTemplateById(selectedTemplateId);
    if (!template) {
      setIsApplying(false);
      return;
    }

    const success = await applyTemplateToBrand(
      selectedTemplateId,
      brand.id,
      template.version,
      user.id
    );
    
    setIsApplying(false);
    
    if (success) {
      onRefresh();
    }
  };

  const handleRevertTemplate = async () => {
    if (!brand || !user) return;
    
    setIsReverting(true);
    const success = await revertBrandTemplate(brand.id, user.id);
    setIsReverting(false);
    
    if (success) {
      onRefresh();
    }
  };

  if (!brand) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Edit Brand: {brand.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="domain" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Domain
            </TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme-corp"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for the brand's default URL path
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Monthly SMS Limit</Label>
              <Input
                id="limit"
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="10000"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="domain" className="mt-4">
            <BrandDomainTab
              brandId={brand.id}
              initialDomain={brand.domain}
              onDomainChange={onRefresh}
            />
          </TabsContent>

          <TabsContent value="template" className="space-y-6 mt-4">
            {/* Current Template Info */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h4 className="font-medium text-sm text-foreground">Current Template</h4>
              {brand.active_template ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5 text-primary" />
                    <span className="font-medium">{brand.active_template.name}</span>
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                      v{brand.active_template.version}
                    </span>
                  </div>
                  {brand.template_applied_at && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Applied {format(new Date(brand.template_applied_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No template assigned</p>
              )}
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <Label>Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {publishedTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        <span className="text-xs text-muted-foreground">v{template.version}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only published templates are available for assignment
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleApplyTemplate}
                disabled={!selectedTemplateId || selectedTemplateId === brand.active_template_id || isApplying}
              >
                {isApplying ? "Applying..." : "Apply Template"}
              </Button>
              
              {brand.previous_template_id && (
                <Button
                  variant="outline"
                  onClick={handleRevertTemplate}
                  disabled={isReverting}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {isReverting ? "Reverting..." : "Revert to Previous Template"}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
