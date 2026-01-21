import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/StatusPill";
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  AlertTriangle,
  Check,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface APIKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: "active" | "revoked";
}

const mockKeys: APIKey[] = [
  { id: "key_001", name: "Production API Key", key: "sk_live_8a7b9c4d5e6f7g8h9i0j1k2l3m4n5o6p", created: "2024-01-10", lastUsed: "2024-01-15", status: "active" },
  { id: "key_002", name: "Development Key", key: "sk_test_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p", created: "2024-01-08", lastUsed: "2024-01-14", status: "active" },
  { id: "key_003", name: "Legacy Key (Deprecated)", key: "sk_live_old_9z8y7x6w5v4u3t2s1r0q", created: "2023-12-01", lastUsed: "2024-01-01", status: "revoked" },
];

export function APIKeysTable() {
  const [keys, setKeys] = useState<APIKey[]>(mockKeys);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<APIKey | null>(null);
  const [confirmStep, setConfirmStep] = useState(0);

  const toggleReveal = (keyId: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const copyToClipboard = async (key: string, keyId: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    return key.slice(0, 8) + "•".repeat(24) + key.slice(-4);
  };

  const handleRevoke = () => {
    if (keyToRevoke && confirmStep === 1) {
      setKeys((prev) =>
        prev.map((k) =>
          k.id === keyToRevoke.id ? { ...k, status: "revoked" as const } : k
        )
      );
      setKeyToRevoke(null);
      setConfirmStep(0);
    } else {
      setConfirmStep(1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
          <p className="text-sm text-muted-foreground">Manage your API keys for authentication</p>
        </div>
        <GradientButton className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Key
        </GradientButton>
      </div>

      {/* Keys Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  API Key
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Created
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map((apiKey) => (
                <tr key={apiKey.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">{apiKey.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {revealedKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={apiKey.status === "active" ? "active" : "suspended"}>
                      {apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
                    </StatusPill>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{apiKey.created}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReveal(apiKey.id)}
                        className="h-8 w-8 p-0 rounded-lg"
                        disabled={apiKey.status === "revoked"}
                      >
                        {revealedKeys.has(apiKey.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                        className="h-8 w-8 p-0 rounded-lg"
                        disabled={apiKey.status === "revoked"}
                      >
                        {copiedKey === apiKey.id ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      {apiKey.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setKeyToRevoke(apiKey)}
                          className="h-8 w-8 p-0 rounded-lg hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={!!keyToRevoke} onOpenChange={() => { setKeyToRevoke(null); setConfirmStep(0); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Revoke API Key
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {confirmStep === 0 ? (
                <>
                  Are you sure you want to revoke <strong>{keyToRevoke?.name}</strong>? 
                  This action cannot be undone.
                </>
              ) : (
                <>
                  <span className="text-destructive font-medium">Final confirmation required.</span>
                  <br />
                  Click "Confirm Revoke" to permanently disable this key.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setKeyToRevoke(null); setConfirmStep(0); }}
              className="rounded-xl border-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              className="rounded-xl"
            >
              {confirmStep === 0 ? "Revoke Key" : "Confirm Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
