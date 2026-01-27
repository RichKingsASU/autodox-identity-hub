import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/ui/StatusPill";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Send, Ban, Search, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import type { LandingTemplateListItem, LandingBaseLayout, TemplateStatus } from "@/types/templates";
import { layoutDisplayNames } from "@/components/landing/layouts/LayoutRenderer";

interface TemplatesTableProps {
  templates: LandingTemplateListItem[];
  loading: boolean;
  onPreview: (template: LandingTemplateListItem) => void;
  onEdit: (template: LandingTemplateListItem) => void;
  onApply: (template: LandingTemplateListItem) => void;
  onToggleStatus: (template: LandingTemplateListItem) => void;
  onSearch: (search: string) => void;
  onFilterLayout: (layout: LandingBaseLayout | undefined) => void;
  onFilterStatus: (status: TemplateStatus | undefined) => void;
}

const layoutOptions: { value: LandingBaseLayout; label: string }[] = [
  { value: "hero_focused", label: "Hero Focused" },
  { value: "compliance_heavy", label: "Compliance Heavy" },
  { value: "trust_signal_dense", label: "Trust Signal Dense" },
  { value: "minimal_enterprise", label: "Minimal Enterprise" },
  { value: "sdk_focused", label: "SDK Focused" },
  { value: "global_reach", label: "Global Reach" },
  { value: "security_first", label: "Security First" },
  { value: "conversion_optimized", label: "Conversion Optimized" },
];

const statusOptions: { value: TemplateStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "disabled", label: "Disabled" },
];

export function TemplatesTable({
  templates,
  loading,
  onPreview,
  onEdit,
  onApply,
  onToggleStatus,
  onSearch,
  onFilterLayout,
  onFilterStatus,
}: TemplatesTableProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const getStatusPillVariant = (status: TemplateStatus) => {
    switch (status) {
      case "published":
        return "active";
      case "draft":
        return "pending";
      case "disabled":
        return "suspended";
      default:
        return "pending";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or slug..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={(v) => onFilterLayout(v === "all" ? undefined : v as LandingBaseLayout)}>
          <SelectTrigger className="w-full sm:w-[200px] bg-popover">
            <SelectValue placeholder="All Layouts" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">All Layouts</SelectItem>
            {layoutOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => onFilterStatus(v === "all" ? undefined : v as TemplateStatus)}>
          <SelectTrigger className="w-full sm:w-[150px] bg-popover">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead>Template</TableHead>
              <TableHead>Layout</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    Loading templates...
                  </div>
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No templates found
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <code className="text-xs text-muted-foreground font-mono">
                        {template.slug}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {layoutDisplayNames[template.base_layout]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">v{template.version}</span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={getStatusPillVariant(template.status)}>
                      {template.status}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(template.updated_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreview(template)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(template)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApply(template)}
                        disabled={template.status !== "published"}
                        title="Apply to Brand"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus(template)}
                        title={template.status === "published" ? "Disable" : "Publish"}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
