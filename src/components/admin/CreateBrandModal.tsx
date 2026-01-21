import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Globe, Hash, Zap } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateBrandData } from "@/hooks/useBrands";

const brandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  domain: z.string().optional(),
  monthly_sms_limit: z.coerce.number().min(1000).max(1000000).optional(),
});

type BrandFormData = z.infer<typeof brandSchema>;

interface CreateBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBrandData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateBrandModal({ isOpen, onClose, onSubmit, isLoading }: CreateBrandModalProps) {
  const [step, setStep] = useState(1);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      monthly_sms_limit: 10000,
    },
  });

  const name = watch("name");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("name", value);
    setValue("slug", value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const handleFormSubmit = async (data: BrandFormData) => {
    await onSubmit({
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      monthly_sms_limit: data.monthly_sms_limit,
    });
    reset();
    setStep(1);
    onClose();
  };

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <GlassCard className="relative">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Create New Brand</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Provision a new brand instance with custom configuration
                </p>
              </div>

              {/* Progress */}
              <div className="flex gap-2 mb-6">
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      s <= step ? "bg-primary" : "bg-secondary"
                    }`}
                  />
                ))}
              </div>

              <form onSubmit={handleSubmit(handleFormSubmit)}>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Brand Name
                        </Label>
                        <Input
                          id="name"
                          placeholder="Acme Corporation"
                          {...register("name")}
                          onChange={handleNameChange}
                        />
                        {errors.name && (
                          <p className="text-xs text-destructive">{errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug" className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          URL Slug
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">/</span>
                          <Input
                            id="slug"
                            className="pl-7"
                            placeholder="acme-corporation"
                            {...register("slug")}
                          />
                        </div>
                        {errors.slug && (
                          <p className="text-xs text-destructive">{errors.slug.message}</p>
                        )}
                      </div>

                      <Button 
                        type="button" 
                        onClick={() => setStep(2)} 
                        className="w-full"
                        disabled={!name || !!errors.name || !!errors.slug}
                      >
                        Continue
                      </Button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="domain" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Custom Domain (Optional)
                        </Label>
                        <Input
                          id="domain"
                          placeholder="verify.acme.com"
                          {...register("domain")}
                        />
                        <p className="text-xs text-muted-foreground">
                          You can configure DNS later
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sms_limit" className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Monthly SMS Limit
                        </Label>
                        <Input
                          id="sms_limit"
                          type="number"
                          placeholder="10000"
                          {...register("monthly_sms_limit")}
                        />
                        {errors.monthly_sms_limit && (
                          <p className="text-xs text-destructive">{errors.monthly_sms_limit.message}</p>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setStep(1)}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1"
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating..." : "Create Brand"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
