import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Mail, Gauge, ToggleLeft, Save, Plug } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { IntegrationStatusPanel } from "@/components/admin/IntegrationStatusPanel";

interface AdminSettingsState {
  general: {
    platformName: string;
    supportEmail: string;
    defaultSmsLimit: number;
  };
  email: {
    senderName: string;
    replyToAddress: string;
    signature: string;
  };
  features: {
    maintenanceMode: boolean;
    betaFeatures: boolean;
    debugLogging: boolean;
  };
  rateLimits: {
    apiRequestsPerMinute: number;
    apiRequestsPerDay: number;
    defaultMonthlySms: number;
  };
}

const defaultSettings: AdminSettingsState = {
  general: {
    platformName: "Autodox",
    supportEmail: "support@autodox.com",
    defaultSmsLimit: 10000,
  },
  email: {
    senderName: "Autodox Team",
    replyToAddress: "noreply@autodox.com",
    signature: "Best regards,\nThe Autodox Team",
  },
  features: {
    maintenanceMode: false,
    betaFeatures: false,
    debugLogging: false,
  },
  rateLimits: {
    apiRequestsPerMinute: 60,
    apiRequestsPerDay: 10000,
    defaultMonthlySms: 10000,
  },
};

const STORAGE_KEY = "autodox_admin_settings";

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettingsState>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch {
        console.error("Failed to parse stored settings");
      }
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast({
        title: "Settings saved",
        description: "Your configuration has been updated successfully.",
      });
    } catch {
      toast({
        title: "Error saving settings",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateGeneral = (field: keyof AdminSettingsState["general"], value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [field]: value },
    }));
  };

  const updateEmail = (field: keyof AdminSettingsState["email"], value: string) => {
    setSettings((prev) => ({
      ...prev,
      email: { ...prev.email, [field]: value },
    }));
  };

  const updateFeatures = (field: keyof AdminSettingsState["features"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      features: { ...prev.features, [field]: value },
    }));
  };

  const updateRateLimits = (field: keyof AdminSettingsState["rateLimits"], value: number) => {
    setSettings((prev) => ({
      ...prev,
      rateLimits: { ...prev.rateLimits, [field]: value },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 lg:p-8"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure system-wide settings for the platform.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="rate-limits" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            <span className="hidden sm:inline">Rate Limits</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <ToggleLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <GlassCard>
            <h2 className="text-xl font-semibold text-foreground mb-6">General Settings</h2>
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={settings.general.platformName}
                  onChange={(e) => updateGeneral("platformName", e.target.value)}
                  placeholder="Enter platform name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.general.supportEmail}
                  onChange={(e) => updateGeneral("supportEmail", e.target.value)}
                  placeholder="support@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="defaultSmsLimit">Default SMS Limit (per month)</Label>
                <Input
                  id="defaultSmsLimit"
                  type="number"
                  value={settings.general.defaultSmsLimit}
                  onChange={(e) => updateGeneral("defaultSmsLimit", parseInt(e.target.value) || 0)}
                  placeholder="10000"
                />
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <IntegrationStatusPanel showRefresh autoRefresh />
            <GlassCard>
              <h2 className="text-xl font-semibold text-foreground mb-4">About Integrations</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Netlify</strong> - Handles custom domain provisioning, 
                  DNS verification, and SSL certificate management for brand portals.
                </p>
                <p>
                  <strong className="text-foreground">Email (Resend)</strong> - Manages transactional email 
                  delivery including verification emails, password resets, and notifications.
                </p>
                <p>
                  <strong className="text-foreground">Database</strong> - Cloud backend provides the 
                  database for storing brands, users, applications, and configurations.
                </p>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <GlassCard>
            <h2 className="text-xl font-semibold text-foreground mb-6">Email Configuration</h2>
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="senderName">Sender Name</Label>
                <Input
                  id="senderName"
                  value={settings.email.senderName}
                  onChange={(e) => updateEmail("senderName", e.target.value)}
                  placeholder="Your Company"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="replyToAddress">Reply-To Address</Label>
                <Input
                  id="replyToAddress"
                  type="email"
                  value={settings.email.replyToAddress}
                  onChange={(e) => updateEmail("replyToAddress", e.target.value)}
                  placeholder="noreply@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signature">Email Signature</Label>
                <Textarea
                  id="signature"
                  value={settings.email.signature}
                  onChange={(e) => updateEmail("signature", e.target.value)}
                  placeholder="Best regards,&#10;The Team"
                  rows={4}
                />
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Rate Limits Tab */}
        <TabsContent value="rate-limits">
          <GlassCard>
            <h2 className="text-xl font-semibold text-foreground mb-6">Rate Limits</h2>
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="apiPerMinute">API Requests per Minute</Label>
                <Input
                  id="apiPerMinute"
                  type="number"
                  value={settings.rateLimits.apiRequestsPerMinute}
                  onChange={(e) => updateRateLimits("apiRequestsPerMinute", parseInt(e.target.value) || 0)}
                  placeholder="60"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum API requests allowed per minute per user.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apiPerDay">API Requests per Day</Label>
                <Input
                  id="apiPerDay"
                  type="number"
                  value={settings.rateLimits.apiRequestsPerDay}
                  onChange={(e) => updateRateLimits("apiRequestsPerDay", parseInt(e.target.value) || 0)}
                  placeholder="10000"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum API requests allowed per day per user.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="defaultMonthlySms">Default Monthly SMS Cap</Label>
                <Input
                  id="defaultMonthlySms"
                  type="number"
                  value={settings.rateLimits.defaultMonthlySms}
                  onChange={(e) => updateRateLimits("defaultMonthlySms", parseInt(e.target.value) || 0)}
                  placeholder="10000"
                />
                <p className="text-sm text-muted-foreground">
                  Default SMS limit for new brands.
                </p>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <GlassCard>
            <h2 className="text-xl font-semibold text-foreground mb-6">Feature Flags</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable to show maintenance page to all users.
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.features.maintenanceMode}
                  onCheckedChange={(checked) => updateFeatures("maintenanceMode", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="betaFeatures">Beta Features</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable experimental features for testing.
                  </p>
                </div>
                <Switch
                  id="betaFeatures"
                  checked={settings.features.betaFeatures}
                  onCheckedChange={(checked) => updateFeatures("betaFeatures", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debugLogging">Debug Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable verbose logging for troubleshooting.
                  </p>
                </div>
                <Switch
                  id="debugLogging"
                  checked={settings.features.debugLogging}
                  onCheckedChange={(checked) => updateFeatures("debugLogging", checked)}
                />
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </motion.div>
  );
}
