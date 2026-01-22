import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Palette, Image, Type, Save, X, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortalConfig } from "@/hooks/usePortalConfig";

interface PortalConfigEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: {
    brand_name: string;
    primary_color: string;
    secondary_color: string;
    logo_url: string | null;
  }) => Promise<void>;
  existingConfig?: PortalConfig | null;
  userName: string;
  userEmail: string;
}

export function PortalConfigEditor({
  isOpen,
  onClose,
  onSave,
  existingConfig,
  userName,
  userEmail,
}: PortalConfigEditorProps) {
  const [brandName, setBrandName] = useState("My Portal");
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [secondaryColor, setSecondaryColor] = useState("#EC4899");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingConfig) {
      setBrandName(existingConfig.brand_name);
      setPrimaryColor(existingConfig.primary_color);
      setSecondaryColor(existingConfig.secondary_color);
      setLogoUrl(existingConfig.logo_url || "");
    } else {
      setBrandName("My Portal");
      setPrimaryColor("#8B5CF6");
      setSecondaryColor("#EC4899");
      setLogoUrl("");
    }
  }, [existingConfig, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        brand_name: brandName,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl || null,
      });
      onClose();
    } catch (err) {
      // Error handled by hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Configure Portal
          </DialogTitle>
          <DialogDescription>
            Customize the portal appearance for <strong>{userName}</strong> ({userEmail})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Brand Name */}
          <div className="space-y-2">
            <Label htmlFor="brand-name" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Brand Name
            </Label>
            <Input
              id="brand-name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter brand name"
              required
            />
          </div>

          {/* Colors Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color" className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: primaryColor }}
                />
                Primary Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#8B5CF6"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color" className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: secondaryColor }}
                />
                Secondary Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#EC4899"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logo-url" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Logo URL
            </Label>
            <Input
              id="logo-url"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            {logoUrl && (
              <div className="flex items-center gap-2 mt-2">
                <div className="h-12 w-12 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">Logo preview</span>
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Live Preview</Label>
            <motion.div
              className="rounded-lg border border-border overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Preview Header */}
              <div
                className="h-14 px-4 flex items-center gap-3"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-8 w-8 rounded object-contain bg-white/20"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <span className="font-semibold text-white">{brandName || "Brand Name"}</span>
              </div>
              {/* Preview Body */}
              <div className="p-4 bg-background">
                <div className="flex gap-2">
                  <div
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary Button
                  </div>
                  <div
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Secondary Button
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : existingConfig ? "Update Portal" : "Create Portal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
