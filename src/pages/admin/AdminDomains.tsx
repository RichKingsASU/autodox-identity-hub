import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, Plus, CheckCircle2, AlertCircle, Clock, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/GlassCard";
import { DomainCard } from "@/components/admin/DomainCard";
import { DomainsTable } from "@/components/admin/DomainsTable";
import { DomainListSkeleton } from "@/components/admin/DomainSkeletons";
import { NetlifyConnectionStatus } from "@/components/admin/NetlifyConnectionStatus";
import { useDomainManager } from "@/hooks/useDomainManager";
import { EditBrandModal } from "@/components/admin/EditBrandModal";
import { useBrands, type Brand } from "@/hooks/useBrands";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function AdminDomains() {
  const {
    brandsWithDomains,
    brandsWithoutDomains,
    brands,
    stats,
    loading,
    error,
    fetchBrands,
    verifyDomain,
    provisionSSL,
    retrySSL,
    checkStatus,
    removeDomain,
  } = useDomainManager();

  const { updateBrand, brands: allBrands, fetchBrands: fetchAllBrands } = useBrands();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBrandForConfig, setSelectedBrandForConfig] = useState<Brand | null>(null);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  useEffect(() => {
    fetchBrands();
    fetchAllBrands();
  }, [fetchBrands, fetchAllBrands]);

  // Filter brands
  const filteredBrands = brandsWithDomains.filter(brand => {
    const matchesSearch = 
      brand.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && brand.domain_status === "active") ||
      (statusFilter === "pending" && ["pending", "verifying", "provisioning_ssl"].includes(brand.domain_status || "")) ||
      (statusFilter === "failed" && brand.domain_status === "failed");

    return matchesSearch && matchesStatus;
  });

  // All brands for table view
  const filteredAllBrands = brands.filter(brand => {
    const matchesSearch = 
      brand.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && brand.domain_status === "active") ||
      (statusFilter === "pending" && ["pending", "verifying", "provisioning_ssl"].includes(brand.domain_status || "")) ||
      (statusFilter === "failed" && brand.domain_status === "failed") ||
      (statusFilter === "none" && !brand.domain);

    return matchesSearch && matchesStatus;
  });

  const handleConfigureBrand = (brandId: string) => {
    const brand = allBrands.find(b => b.id === brandId);
    if (brand) {
      setSelectedBrandForConfig(brand);
    }
  };

  const handleSaveBrand = async (brandId: string, updates: Partial<Brand>): Promise<boolean> => {
    const success = await updateBrand(brandId, updates);
    if (success) {
      await fetchBrands();
    }
    return success;
  };

  const handleAddDomain = () => {
    setShowAddDomain(true);
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) => (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Domain Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage custom domains for all brands
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Environment Status */}
          <NetlifyConnectionStatus />
          
          <Button onClick={handleAddDomain}>
            <Plus className="h-4 w-4 mr-2" />
            Add Domain
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Globe} label="Total Brands" value={stats.total} color="bg-primary/10 text-primary" />
        <StatCard icon={CheckCircle2} label="Active Domains" value={stats.active} color="bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-amber-500/10 text-amber-500" />
        <StatCard icon={AlertCircle} label="Failed" value={stats.failed} color="bg-destructive/10 text-destructive" />
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search domains or brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="none">No Domain</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchBrands()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "cards")}>
            <TabsList className="h-9">
              <TabsTrigger value="table" className="text-xs">Table</TabsTrigger>
              <TabsTrigger value="cards" className="text-xs">Cards</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Domain List */}
      {loading ? (
        <DomainListSkeleton count={3} />
      ) : error ? (
        <GlassCard className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load domains</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchBrands}>Try Again</Button>
        </GlassCard>
      ) : viewMode === "table" ? (
        <DomainsTable
          domains={filteredAllBrands}
          loading={loading}
          onVerifyDNS={verifyDomain}
          onActivateDomain={provisionSSL}
          onRetrySSL={retrySSL}
          onAddDomain={handleAddDomain}
        />
      ) : filteredBrands.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || statusFilter !== "all" ? "No matching domains" : "No domains configured"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== "all" 
              ? "Try adjusting your search or filters"
              : "Add a custom domain to get started"}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button onClick={handleAddDomain}>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          )}
        </GlassCard>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {filteredBrands.map((brand, index) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <DomainCard
                domain={brand.domain!}
                status={brand.domain_status}
                brandName={brand.name}
                brandId={brand.id}
                sslStatus={brand.ssl_status}
                verificationToken={brand.domain_verification_token}
                domainError={brand.domain_error}
                onVerify={() => verifyDomain(brand.id)}
                onCheckStatus={() => checkStatus(brand.id)}
                onRemove={() => removeDomain(brand.id)}
                onConfigure={() => handleConfigureBrand(brand.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Domain Modal */}
      {showAddDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Add Domain to Brand</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Brand</label>
                <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    {brandsWithoutDomains.map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {brandsWithoutDomains.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    All brands have domains configured
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddDomain(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!selectedBrandId}
                  onClick={() => {
                    const brand = allBrands.find(b => b.id === selectedBrandId);
                    if (brand) {
                      setSelectedBrandForConfig(brand);
                      setShowAddDomain(false);
                      setSelectedBrandId("");
                    }
                  }}
                >
                  Configure Domain
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Edit Brand Modal */}
      <EditBrandModal
        brand={selectedBrandForConfig}
        isOpen={!!selectedBrandForConfig}
        onClose={() => setSelectedBrandForConfig(null)}
        onSave={handleSaveBrand}
        onRefresh={() => {
          fetchBrands();
          fetchAllBrands();
        }}
      />
    </div>
  );
}
