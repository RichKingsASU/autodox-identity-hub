import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandPortfolioTable } from "@/components/admin/BrandPortfolioTable";
import { CreateBrandModal } from "@/components/admin/CreateBrandModal";
import { EditBrandModal } from "@/components/admin/EditBrandModal";
import { useBrands, Brand, CreateBrandData } from "@/hooks/useBrands";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminBrands() {
  const { brands, loading, createBrand, updateBrandStatus, updateBrand, deleteBrand, fetchBrands } = useBrands();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Brand | null>(null);

  const handleCreate = async (data: CreateBrandData) => {
    setIsCreating(true);
    await createBrand(data);
    setIsCreating(false);
  };

  const handleStatusChange = async (brandId: string, status: Brand["status"]) => {
    await updateBrandStatus(brandId, status);
  };

  const handleEdit = (brand: Brand) => {
    setEditTarget(brand);
  };

  const handleSaveEdit = async (brandId: string, updates: Partial<Pick<Brand, "name" | "slug" | "domain" | "monthly_sms_limit">>) => {
    return await updateBrand(brandId, updates);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteBrand(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brand Portfolio</h1>
          <p className="text-muted-foreground">
            Manage all brand instances and their configurations
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Brand
        </Button>
      </div>

      <BrandPortfolioTable
        brands={brands}
        loading={loading}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteTarget(id)}
      />

      <CreateBrandModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isLoading={isCreating}
      />

      <EditBrandModal
        brand={editTarget}
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
        onRefresh={fetchBrands}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this brand? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}