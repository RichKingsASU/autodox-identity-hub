import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { RecessedInput } from "@/components/ui/RecessedInput";
import { Button } from "@/components/ui/button";
import { Search, Filter, RefreshCw } from "lucide-react";

interface SMSLog {
  id: string;
  recipient: string;
  type: string;
  status: "delivered" | "failed" | "pending";
  timestamp: string;
  message: string;
}

const mockLogs: SMSLog[] = [
  { id: "sms_001", recipient: "+1 (555) 123-4567", type: "OTP", status: "delivered", timestamp: "2024-01-15 14:23:45", message: "Your verification code is 847291" },
  { id: "sms_002", recipient: "+1 (555) 987-6543", type: "Verification", status: "delivered", timestamp: "2024-01-15 14:21:12", message: "Identity verification successful" },
  { id: "sms_003", recipient: "+1 (555) 456-7890", type: "OTP", status: "failed", timestamp: "2024-01-15 14:19:33", message: "Your verification code is 193847" },
  { id: "sms_004", recipient: "+1 (555) 321-0987", type: "Alert", status: "pending", timestamp: "2024-01-15 14:17:08", message: "New login detected from Chrome" },
  { id: "sms_005", recipient: "+1 (555) 654-3210", type: "OTP", status: "delivered", timestamp: "2024-01-15 14:15:22", message: "Your verification code is 582910" },
];

export function SMSLogsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [logs] = useState<SMSLog[]>(mockLogs);

  const filteredLogs = logs.filter(
    (log) =>
      log.recipient.includes(searchTerm) ||
      log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by phone, type, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[hsl(var(--surface-recessed))] border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 rounded-xl border-border hover:bg-secondary">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl border-border hover:bg-secondary">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  ID
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Recipient
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Type
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-muted-foreground">{log.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-foreground">{log.recipient}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{log.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={log.status}>
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </StatusPill>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-muted-foreground">{log.timestamp}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No logs found matching your search.
          </div>
        )}
      </GlassCard>
    </div>
  );
}
