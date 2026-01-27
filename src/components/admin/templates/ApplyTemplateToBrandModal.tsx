import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/ui/GradientButton";
import { AlertTriangle, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBrands, type Brand } from "@/hooks/useBrands";
import type { LandingTemplateListItem } from "@/types/templates";

interface ApplyTemplateToBrandModalProps {
  template: LandingTemplateListItem | null;
  open: boolean;
  onClose: () => void;
  onApply: (templateId: string, brandId: string, templateVersion: number) => Promise<boolean>;
}

export function ApplyTemplateToBrandModal({ 
  template, 
  open, 
  onClose, 
  onApply 
}: ApplyTemplateToBrandModalProps) {
  const { brands, loading: brandsLoading, fetchBrands } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [applying, setApplying] = useState(false);

  // Fetch brands when modal opens
  useEffect(() => {
    if (open) {
      fetchBrands();
      setSelectedBrandId("");
    }
  }, [open, fetchBrands]);

  const activeBrands = brands.filter(b => b.status === "active");
  const selectedBrand = activeBrands.find(b => b.id === selectedBrandId);

  const handleApply = async () => {
    if (!template || !selectedBrandId) return;
    
    setApplying(true);
    const success = await onApply(template.id, selectedBrandId, template.version);
    setApplying(false);
    
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Apply Template to Brand
          </DialogTitle>
          <DialogDescription>
            Select a brand to apply this template to. The change takes effect immediately.
          </DialogDescription>
        </DialogHeader>

        {template && (
          <div className="space-y-4 py-4">
            {/* Template Info */}
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium">{template.name}</p>
              <p className="text-xs font-mono text-muted-foreground">v{template.version}</p>
            </div>

            {/* Brand Selector */}
            <div className="space-y-2">
              <Label>Select Brand</Label>
              <Select 
                value={selectedBrandId} 
                onValueChange={setSelectedBrandId}
                disabled={brandsLoading}
              >
                <SelectTrigger className="bg-popover">
                  <SelectValue placeholder={brandsLoading ? "Loading brands..." : "Choose a brand"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {activeBrands.length === 0 ? (
                    <SelectItem value="none" disabled>No active brands available</SelectItem>
                  ) : (
                    activeBrands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Warning */}
            {selectedBrand && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-500">Warning</p>
                  <p className="text-muted-foreground">
                    This will replace <strong>{selectedBrand.name}</strong>'s landing page. 
                    The change takes effect immediately.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={applying}>
            Cancel
          </Button>
          <GradientButton 
            onClick={handleApply} 
            disabled={applying || !selectedBrandId}
          >
            <Send className="h-4 w-4 mr-2" />
            {applying ? "Applying..." : "Apply Template"}
          </GradientButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
