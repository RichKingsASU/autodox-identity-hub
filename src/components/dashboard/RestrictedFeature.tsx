import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface RestrictedFeatureProps {
  children: ReactNode;
  featureName: string;
}

export function RestrictedFeature({ children, featureName }: RestrictedFeatureProps) {
  const { application } = useAuth();
  const navigate = useNavigate();
  const isLocked = application?.status !== "approved";

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[400px]">
      {/* Blurred background content */}
      <div className="blur-md pointer-events-none opacity-50 select-none">
        {children}
      </div>

      {/* Lock overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 max-w-md text-center"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2">
            Complete Your Application
          </h3>
          
          <p className="text-muted-foreground mb-6">
            To access {featureName}, you need to complete your business verification application.
          </p>

          <Button
            onClick={() => navigate("/application")}
            className="btn-gradient text-primary-foreground font-semibold px-8"
          >
            Complete Application
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
