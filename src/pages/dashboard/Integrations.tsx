import { RestrictedFeature } from "@/components/dashboard/RestrictedFeature";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Webhook, Database, Cloud, Smartphone } from "lucide-react";

const integrations = [
  {
    icon: Webhook,
    name: "Webhooks",
    description: "Receive real-time notifications for verification events",
    connected: true,
  },
  {
    icon: Database,
    name: "Salesforce",
    description: "Sync verified contacts with your CRM",
    connected: false,
  },
  {
    icon: Cloud,
    name: "AWS S3",
    description: "Store verification documents in your S3 bucket",
    connected: false,
  },
  {
    icon: Smartphone,
    name: "Twilio",
    description: "Use your own Twilio account for SMS delivery",
    connected: true,
  },
];

export default function Integrations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground">
          Connect Autodox with your favorite tools and services.
        </p>
      </div>

      <RestrictedFeature featureName="Integrations">
        <div className="grid sm:grid-cols-2 gap-4">
          {integrations.map((integration) => (
            <GlassCard key={integration.name} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <integration.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <Switch checked={integration.connected} />
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {integration.connected ? "Configure" : "Connect"}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      </RestrictedFeature>
    </div>
  );
}
