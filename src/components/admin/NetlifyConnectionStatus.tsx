import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, Cloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ConnectionStatus {
  connected: boolean;
  checking: boolean;
  error?: string;
}

export function NetlifyConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    checking: true,
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, checking: true }));
    
    try {
      // Call the check-domain-status function with a dummy brandId
      // The function will return different responses based on whether Netlify is configured
      const response = await supabase.functions.invoke('check-domain-status', {
        body: { brandId: '00000000-0000-0000-0000-000000000000' },
      });

      // If we get a 404 (brand not found) but no error about Netlify,
      // it means Netlify is configured. If the edge function is working
      // with Netlify credentials, connection is established.
      // We infer connection status from whether the error mentions Netlify
      const isConnected = !response.error?.message?.includes('Netlify') && 
                          !response.data?.error?.includes('Netlify');
      
      setStatus({
        connected: isConnected,
        checking: false,
      });
    } catch (err) {
      setStatus({
        connected: false,
        checking: false,
        error: 'Unable to check connection',
      });
    }
  };

  if (status.checking) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Checking connection...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
      status.connected 
        ? 'bg-emerald-500/10 border-emerald-500/30' 
        : 'bg-destructive/10 border-destructive/30'
    }`}>
      <Cloud className={`h-4 w-4 ${status.connected ? 'text-emerald-500' : 'text-destructive'}`} />
      {status.connected ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-600">Netlify Connected</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">Netlify Not Connected</span>
        </>
      )}
    </div>
  );
}
