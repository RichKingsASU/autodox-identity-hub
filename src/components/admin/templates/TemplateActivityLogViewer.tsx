import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import type { TemplateActivityLog } from "@/types/templates";

interface TemplateActivityLogViewerProps {
  logs: TemplateActivityLog[];
  loading: boolean;
}

const actionColors: Record<string, string> = {
  created: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  updated: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  published: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  applied: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  disabled: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  reverted: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export function TemplateActivityLogViewer({ logs, loading }: TemplateActivityLogViewerProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="w-8"></TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Admin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  Loading activity log...
                </div>
              </TableCell>
            </TableRow>
          ) : logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No activity log entries found
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <>
                <TableRow key={log.id} className="cursor-pointer" onClick={() => toggleRow(log.id)}>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {expandedRows.has(log.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(log.performed_at), "MMM d, yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={actionColors[log.action] || ""}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono">{log.template_slug}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.brand_id ? log.brand_id.slice(0, 8) + "..." : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono">
                    {log.performed_by.slice(0, 8)}...
                  </TableCell>
                </TableRow>
                {expandedRows.has(log.id) && log.changes && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-secondary/30">
                      <div className="p-4">
                        <p className="text-sm font-medium mb-2">Changes</p>
                        <pre className="text-xs font-mono bg-background p-3 rounded-lg overflow-auto max-h-48">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
