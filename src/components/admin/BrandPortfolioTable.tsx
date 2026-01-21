import { useState } from "react";
import { motion } from "framer-motion";
import { 
  MoreHorizontal, 
  Search, 
  Filter,
  Building2,
  ExternalLink,
  Pencil,
  Trash2,
  Power,
  PowerOff
} from "lucide-react";
import { format } from "date-fns";
import { Brand } from "@/hooks/useBrands";
import { StatusPill } from "@/components/ui/StatusPill";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BrandPortfolioTableProps {
  brands: Brand[];
  loading: boolean;
  onStatusChange: (brandId: string, status: Brand["status"]) => void;
  onEdit: (brand: Brand) => void;
  onDelete: (brandId: string) => void;
}

const statusMap: Record<Brand["status"], { label: string; pillStatus: "active" | "pending" | "suspended" | "unverified" }> = {
  provisioning: { label: "Provisioning", pillStatus: "pending" },
  active: { label: "Active", pillStatus: "active" },
  suspended: { label: "Suspended", pillStatus: "suspended" },
  archived: { label: "Archived", pillStatus: "unverified" },
};

export function BrandPortfolioTable({ 
  brands, 
  loading, 
  onStatusChange, 
  onEdit, 
  onDelete 
}: BrandPortfolioTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = 
      brand.name.toLowerCase().includes(search.toLowerCase()) ||
      brand.slug.toLowerCase().includes(search.toLowerCase()) ||
      (brand.domain?.toLowerCase().includes(search.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === "all" || brand.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getUsagePercent = (brand: Brand) => {
    return Math.round((brand.current_month_usage / brand.monthly_sms_limit) * 100);
  };

  if (loading) {
    return (
      <GlassCard>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-secondary rounded-lg w-1/3" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-secondary rounded-lg" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-0 overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="provisioning">Provisioning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No brands found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand, index) => (
                <motion.tr
                  key={brand.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{brand.name}</p>
                        <p className="text-xs text-muted-foreground">/{brand.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={statusMap[brand.status].pillStatus}>
                      {statusMap[brand.status].label}
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    {brand.domain ? (
                      <a 
                        href={`https://${brand.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {brand.domain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {brand.current_month_usage.toLocaleString()} / {brand.monthly_sms_limit.toLocaleString()}
                        </span>
                        <span className="text-foreground font-medium">{getUsagePercent(brand)}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                          style={{ width: `${Math.min(getUsagePercent(brand), 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(brand.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(brand)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Brand
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {brand.status === "active" ? (
                          <DropdownMenuItem onClick={() => onStatusChange(brand.id, "suspended")}>
                            <PowerOff className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        ) : brand.status === "suspended" ? (
                          <DropdownMenuItem onClick={() => onStatusChange(brand.id, "active")}>
                            <Power className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        ) : brand.status === "provisioning" ? (
                          <DropdownMenuItem onClick={() => onStatusChange(brand.id, "active")}>
                            <Power className="h-4 w-4 mr-2" />
                            Complete Provisioning
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem 
                          onClick={() => onStatusChange(brand.id, "archived")}
                          disabled={brand.status === "archived"}
                        >
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(brand.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
        <span>Showing {filteredBrands.length} of {brands.length} brands</span>
      </div>
    </GlassCard>
  );
}
