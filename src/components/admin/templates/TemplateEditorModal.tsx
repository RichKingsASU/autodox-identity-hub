import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GradientButton } from "@/components/ui/GradientButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useTemplatePreview } from "@/hooks/useTemplatePreview";
import { layoutDisplayNames } from "@/components/landing/layouts/LayoutRenderer";
import { format } from "date-fns";
import { Lock, Save, Eye, EyeOff, CheckCircle } from "lucide-react";
import type { LandingTemplateListItem, DefaultCopy, ThemeOverrides, TemplateStatus } from "@/types/templates";

interface TemplateEditorModalProps {
  template: LandingTemplateListItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (templateId: string, updates: { default_copy?: DefaultCopy; default_theme_overrides?: ThemeOverrides }) => Promise<boolean>;
  onStatusChange: (templateId: string, status: TemplateStatus) => Promise<boolean>;
}

export function TemplateEditorModal({ 
  template, 
  open, 
  onClose, 
  onSave,
  onStatusChange 
}: TemplateEditorModalProps) {
  const { data: fullTemplate, isLoading, refetch } = useTemplatePreview(template?.id || null);
  
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");
  const [primaryCtaText, setPrimaryCtaText] = useState("");
  const [trustBadgeText, setTrustBadgeText] = useState("");
  const [footerDisclaimer, setFooterDisclaimer] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#d946ef");
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  const [saving, setSaving] = useState(false);

  // Populate form when template loads
  useEffect(() => {
    if (fullTemplate) {
      setHeroHeadline(fullTemplate.default_copy.heroHeadline || "");
      setHeroSubheadline(fullTemplate.default_copy.heroSubheadline || "");
      setPrimaryCtaText(fullTemplate.default_copy.primaryCtaText || "");
      setTrustBadgeText(fullTemplate.default_copy.trustBadgeText || "");
      setFooterDisclaimer(fullTemplate.default_copy.footerDisclaimer || "");
      setPrimaryColor(fullTemplate.default_theme_overrides.primaryColor || "#d946ef");
      setAccentColor(fullTemplate.default_theme_overrides.accentColor || "#8b5cf6");
    }
  }, [fullTemplate]);

  const handleSave = async () => {
    if (!template) return;
    
    setSaving(true);
    const success = await onSave(template.id, {
      default_copy: {
        ...fullTemplate?.default_copy,
        heroHeadline,
        heroSubheadline,
        primaryCtaText,
        trustBadgeText,
        footerDisclaimer,
      },
      default_theme_overrides: {
        primaryColor,
        accentColor,
      },
    });
    
    if (success) {
      refetch();
    }
    setSaving(false);
  };

  const handleStatusChange = async (newStatus: TemplateStatus) => {
    if (!template) return;
    setSaving(true);
    await onStatusChange(template.id, newStatus);
    setSaving(false);
    onClose();
  };

  const currentStatus = fullTemplate?.status || template?.status;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Edit Template</DialogTitle>
            {template && (
              <Badge variant="secondary">
                {layoutDisplayNames[template.base_layout]}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : fullTemplate ? (
          <div className="space-y-6 py-4">
            {/* Read-only Info */}
            <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Template Info (Read-only)</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  <span className="font-medium">{fullTemplate.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Slug:</span>{" "}
                  <code className="font-mono text-xs">{fullTemplate.slug}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Version:</span>{" "}
                  <span className="font-mono">v{fullTemplate.version}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Updated:</span>{" "}
                  <span>{format(new Date(fullTemplate.updated_at), "MMM d, yyyy HH:mm")}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Editable Copy Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold">Copy</h3>
              
              <div className="space-y-2">
                <Label htmlFor="heroHeadline">Hero Headline</Label>
                <Input
                  id="heroHeadline"
                  value={heroHeadline}
                  onChange={(e) => setHeroHeadline(e.target.value.slice(0, 100))}
                  maxLength={100}
                  placeholder="Main headline..."
                />
                <p className="text-xs text-muted-foreground text-right">{heroHeadline.length}/100</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heroSubheadline">Hero Subheadline</Label>
                <Textarea
                  id="heroSubheadline"
                  value={heroSubheadline}
                  onChange={(e) => setHeroSubheadline(e.target.value.slice(0, 200))}
                  maxLength={200}
                  placeholder="Supporting text..."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground text-right">{heroSubheadline.length}/200</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryCtaText">Primary CTA Text</Label>
                <Input
                  id="primaryCtaText"
                  value={primaryCtaText}
                  onChange={(e) => setPrimaryCtaText(e.target.value.slice(0, 30))}
                  maxLength={30}
                  placeholder="Get Started"
                />
                <p className="text-xs text-muted-foreground text-right">{primaryCtaText.length}/30</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trustBadgeText">Trust Badge Text</Label>
                <Input
                  id="trustBadgeText"
                  value={trustBadgeText}
                  onChange={(e) => setTrustBadgeText(e.target.value.slice(0, 50))}
                  maxLength={50}
                  placeholder="Trusted by 1000+ companies"
                />
                <p className="text-xs text-muted-foreground text-right">{trustBadgeText.length}/50</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerDisclaimer">Footer Disclaimer</Label>
                <Textarea
                  id="footerDisclaimer"
                  value={footerDisclaimer}
                  onChange={(e) => setFooterDisclaimer(e.target.value.slice(0, 500))}
                  maxLength={500}
                  placeholder="Legal disclaimer text..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">{footerDisclaimer.length}/500</p>
              </div>
            </div>

            <Separator />

            {/* Theme Colors */}
            <div className="space-y-4">
              <h3 className="font-semibold">Theme Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#d946ef"
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="accentColor"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#8b5cf6"
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Status Controls */}
            <div className="space-y-4">
              <h3 className="font-semibold">Status</h3>
              <div className="flex items-center gap-4">
                <Badge variant={currentStatus === "published" ? "default" : "secondary"}>
                  {currentStatus}
                </Badge>
                {currentStatus === "draft" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange("published")}
                    disabled={saving}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                )}
                {currentStatus === "published" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange("disabled")}
                    disabled={saving}
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Disable
                  </Button>
                )}
                {currentStatus === "disabled" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange("published")}
                    disabled={saving}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Republish
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <GradientButton onClick={handleSave} disabled={saving || isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </GradientButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
