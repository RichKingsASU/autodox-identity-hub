import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Globe, Settings } from "lucide-react";
import { Brand } from "@/hooks/useBrands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainConfigPanel } from "./DomainConfigPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setSlug(brand.slug);
      setMonthlyLimit(brand.monthly_sms_limit.toString());
    }
  }, [brand]);

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="domain" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Domain
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
            <DomainConfigPanel
              brandId={brand.id}
              currentDomain={brand.domain}
              onDomainChange={handleDomainChange}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
