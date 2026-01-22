import { RestrictedFeature } from "@/components/dashboard/RestrictedFeature";
import { APIKeysTable } from "@/components/dashboard/APIKeysTable";

export default function APIKeys() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
        <p className="text-muted-foreground">
          Manage your API keys for production and development environments.
        </p>
      </div>

      <RestrictedFeature featureName="API Keys">
        <APIKeysTable />
      </RestrictedFeature>
    </div>
  );
}
