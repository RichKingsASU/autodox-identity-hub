import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { RecessedInput } from "@/components/ui/RecessedInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

interface LeadCaptureCardProps {
  onComplete: (data: { firstName: string; lastName: string; email: string; phone: string }) => void;
}

export function LeadCaptureCard({ onComplete }: LeadCaptureCardProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name: string, value: string) => {
    try {
      leadSchema.shape[name as keyof typeof leadSchema.shape].parse(value);
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [name]: e.errors[0].message }));
      }
      return false;
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof typeof formData]);
  };

  const isFieldValid = (name: string) => {
    return touched[name] && !errors[name] && formData[name as keyof typeof formData].length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const result = leadSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      setTouched({ firstName: true, lastName: true, email: true, phone: true });
      return;
    }

    if (!termsAccepted || !smsConsent) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    toast({
      title: "Great start!",
      description: "Now let's create your account to continue.",
    });
    
    onComplete(formData);
  };

  const isFormValid =
    Object.values(formData).every((v) => v.length > 0) &&
    Object.values(errors).every((e) => !e) &&
    termsAccepted &&
    smsConsent;

  return (
    <GlassCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-md"
    >
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Get Started Free</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">
          Start Your Journey
        </h2>
        <p className="text-sm text-muted-foreground">
          Identity verification made simple. No credit card required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <RecessedInput
            label="First Name"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            onBlur={() => handleBlur("firstName")}
            error={touched.firstName ? errors.firstName : undefined}
            isValid={isFieldValid("firstName")}
          />
          <RecessedInput
            label="Last Name"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            onBlur={() => handleBlur("lastName")}
            error={touched.lastName ? errors.lastName : undefined}
            isValid={isFieldValid("lastName")}
          />
        </div>

        <RecessedInput
          label="Email Address"
          type="email"
          placeholder="john@company.com"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          error={touched.email ? errors.email : undefined}
          isValid={isFieldValid("email")}
        />

        <RecessedInput
          label="Phone Number"
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          error={touched.phone ? errors.phone : undefined}
          isValid={isFieldValid("phone")}
        />

        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              I agree to the{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={smsConsent}
              onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
              className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              I consent to receive SMS notifications about my verification status
            </span>
          </label>
        </div>

        <GradientButton
          type="submit"
          size="lg"
          className="w-full mt-4"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
            />
          ) : (
            <>
              GET STARTED
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </GradientButton>
      </form>

      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>256-bit encryption · SOC 2 compliant</span>
      </div>
    </GlassCard>
  );
}
