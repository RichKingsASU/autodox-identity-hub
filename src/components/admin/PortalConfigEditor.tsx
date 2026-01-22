import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Palette, Image, Type, Save, X, Upload, Trash2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  userId: string;
}

export function PortalConfigEditor({
  isOpen,
  onClose,
  onSave,
  existingConfig,
  userName,
  userEmail,
  userId,
}: PortalConfigEditorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brandName, setBrandName] = useState("My Portal");
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [secondaryColor, setSecondaryColor] = useState("#EC4899");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existingConfig) {
      setBrandName(existingConfig.brand_name);
      setPrimaryColor(existingConfig.primary_color);
      setSecondaryColor(existingConfig.secondary_color);
      setLogoUrl(existingConfig.logo_url || null);
    } else {
      setBrandName("My Portal");
      setPrimaryColor("#8B5CF6");
      setSecondaryColor("#EC4899");
      setLogoUrl(null);
    }
  }, [existingConfig, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, SVG, etc.)",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
      });
      return;
    }

    setUploading(true);
    try {
      // Create a unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split("/portal-logos/")[1];
        if (oldPath) {
          await supabase.storage.from("portal-logos").remove([oldPath]);
        }
      }

      // Upload new logo
      const { data, error } = await supabase.storage
        .from("portal-logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("portal-logos")
        .getPublicUrl(data.path);

      setLogoUrl(urlData.publicUrl);
      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload logo",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (logoUrl) {
      const oldPath = logoUrl.split("/portal-logos/")[1];
      if (oldPath) {
        await supabase.storage.from("portal-logos").remove([oldPath]);
      }
    }
    setLogoUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        brand_name: brandName,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl,
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

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Logo
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {logoUrl ? (
              <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/30">
                <div className="h-16 w-16 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Logo uploaded</p>
                  <p className="text-xs text-muted-foreground">Click below to change or remove</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full"
                    />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload logo (max 2MB)
                    </span>
                  </>
                )}
              </button>
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
            <Button type="submit" disabled={saving || uploading}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : existingConfig ? "Update Portal" : "Create Portal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
