import { motion } from "framer-motion";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { useBrands } from "@/hooks/useBrands";

export default function AdminDashboard() {
  const { brands, loading } = useBrands();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of all brand instances and system health
        </p>
      </div>

      <AdminOverview brands={brands} loading={loading} />
    </motion.div>
  );
}
