import { useState, useEffect } from "react";
import { Mail, Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailSettingsTabProps {
  brandId: string;
  brandName: string;
}

interface EmailSettings {
  id?: string;
  from_name: string;
  from_email: string;
  reply_to_email: string;
  sending_domain: string;
  sending_domain_status: 'pending' | 'verified' | 'failed';
}

const DEFAULT_SETTINGS: EmailSettings = {
  from_name: "",
  from_email: "noreply@email.agents-institute.com",
  reply_to_email: "",
  sending_domain: "",
  sending_domain_status: "pending",
};

export function EmailSettingsTab({ brandId, brandName }: EmailSettingsTabProps) {
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [brandId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brand_email_settings')
        .select('*')
        .eq('brand_id', brandId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          from_name: data.from_name || brandName,
          from_email: data.from_email || DEFAULT_SETTINGS.from_email,
          reply_to_email: data.reply_to_email || "",
          sending_domain: data.sending_domain || "",
          sending_domain_status: (data.sending_domain_status as 'pending' | 'verified' | 'failed') || "pending",
        });
      } else {
        setSettings({
          ...DEFAULT_SETTINGS,
          from_name: brandName,
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch email settings:", err);
      toast.error("Failed to load email settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof EmailSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        brand_id: brandId,
        from_name: settings.from_name || brandName,
        from_email: settings.from_email,
        reply_to_email: settings.reply_to_email || null,
        sending_domain: settings.sending_domain || null,
        sending_domain_status: settings.sending_domain_status,
      };

      if (settings.id) {
        const { error } = await supabase
          .from('brand_email_settings')
          .update(payload)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brand_email_settings')
          .insert(payload);

        if (error) throw error;
      }

      toast.success("Email settings saved");
      setHasChanges(false);
      await fetchSettings();
    } catch (err: any) {
      console.error("Failed to save email settings:", err);
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          Configure how emails are sent from this brand. Changes will apply to all automated emails.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="from_name">Sender Name</Label>
          <Input
            id="from_name"
            value={settings.from_name}
            onChange={(e) => handleChange("from_name", e.target.value)}
            placeholder={brandName}
          />
          <p className="text-xs text-muted-foreground">
            The name that appears in the "From" field of emails
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="from_email">Sender Email</Label>
          <Input
            id="from_email"
            type="email"
            value={settings.from_email}
            onChange={(e) => handleChange("from_email", e.target.value)}
            placeholder="noreply@yourdomain.com"
          />
          <p className="text-xs text-muted-foreground">
            Must be from a verified domain in Resend
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reply_to_email">Reply-To Email (optional)</Label>
          <Input
            id="reply_to_email"
            type="email"
            value={settings.reply_to_email}
            onChange={(e) => handleChange("reply_to_email", e.target.value)}
            placeholder="support@yourdomain.com"
          />
          <p className="text-xs text-muted-foreground">
            Where replies should be directed
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="sending_domain">Sending Domain</Label>
            {settings.sending_domain && (
              <Badge 
                variant={settings.sending_domain_status === 'verified' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {settings.sending_domain_status}
              </Badge>
            )}
          </div>
          <Input
            id="sending_domain"
            value={settings.sending_domain}
            onChange={(e) => handleChange("sending_domain", e.target.value)}
            placeholder="mail.yourdomain.com"
          />
          <p className="text-xs text-muted-foreground">
            Configure this domain in Resend for custom sending
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
