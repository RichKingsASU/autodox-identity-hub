import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { RecessedInput } from "@/components/ui/RecessedInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, ArrowRight, Building2, Briefcase, FileText, Check, Loader2, HelpCircle } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface StepProps {
  isActive: boolean;
  isCompleted: boolean;
  stepNumber: number;
  title: string;
}

function StepIndicator({ isActive, isCompleted, stepNumber, title }: StepProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
          isCompleted
            ? "bg-success text-success-foreground"
            : isActive
            ? "btn-gradient text-primary-foreground"
            : "bg-secondary text-muted-foreground"
        }`}
      >
        {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
      </div>
      <span
        className={`font-medium transition-colors ${
          isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

// EIN Input with 3-second linger tooltip
function EINInputWithTooltip({
  value,
  onChange,
  error,
  isValid,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  isValid: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const lingerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatEIN = (input: string) => {
    const digits = input.replace(/\D/g, "").slice(0, 9);
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    return digits;
  };

  const handleFocus = () => {
    lingerTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);
  };

  const handleBlur = () => {
    if (lingerTimeoutRef.current) {
      clearTimeout(lingerTimeoutRef.current);
    }
    setShowTooltip(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatEIN(e.target.value));
    // Reset the linger timer on any input
    if (lingerTimeoutRef.current) {
      clearTimeout(lingerTimeoutRef.current);
    }
    lingerTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (lingerTimeoutRef.current) {
        clearTimeout(lingerTimeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip}>
        <TooltipTrigger asChild>
          <div className="relative">
            <RecessedInput
              ref={inputRef}
              label={
                <span className="flex items-center gap-1.5">
                  Employer Identification Number (EIN)
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              }
              placeholder="XX-XXXXXXX"
              value={value}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              error={error}
              isValid={isValid}
              className="font-mono"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          className="max-w-xs bg-card border-border p-3"
          onPointerDownOutside={() => setShowTooltip(false)}
        >
          <div className="space-y-2">
            <p className="font-medium text-foreground text-sm">Where to find your EIN</p>
            <p className="text-xs text-muted-foreground">
              Your Employer Identification Number (EIN) is a 9-digit number assigned by the IRS. 
              You can find it on:
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
              <li>IRS Form SS-4 confirmation letter</li>
              <li>Previous tax returns (Form 1120, 1065)</li>
              <li>IRS correspondence</li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ApplicationStepperProps {
  userData: { firstName: string; lastName: string; email: string; phone: string | null };
}

const einSchema = z.string().regex(/^\d{2}-\d{7}$/, "EIN must be in format XX-XXXXXXX");

export function ApplicationStepper({ userData }: ApplicationStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitApplication, refetchApplication } = useAuth();
  const { toast } = useToast();
  
  const [step1Data, setStep1Data] = useState({
    companyName: "",
    ein: "",
  });
  
  const [step2Data, setStep2Data] = useState({
    useCase: "",
    monthlyVolume: "",
  });
  
  const [step3Data, setStep3Data] = useState({
    tosUrl: "",
    privacyUrl: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { title: "Legal Identity", icon: Building2 },
    { title: "Use Case", icon: Briefcase },
    { title: "Compliance", icon: FileText },
  ];

  const formatEIN = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    return digits;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!step1Data.companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
      if (!einSchema.safeParse(step1Data.ein).success) {
        newErrors.ein = "EIN must be in format XX-XXXXXXX";
      }
    } else if (step === 1) {
      if (!step2Data.useCase) {
        newErrors.useCase = "Please select a use case";
      }
      if (!step2Data.monthlyVolume) {
        newErrors.monthlyVolume = "Please select monthly volume";
      }
    } else if (step === 2) {
      if (!step3Data.tosUrl.trim()) {
        newErrors.tosUrl = "Terms of Service URL is required";
      }
      if (!step3Data.privacyUrl.trim()) {
        newErrors.privacyUrl = "Privacy Policy URL is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
        toast({
          title: `Step ${currentStep + 1} completed`,
          description: `Moving to ${steps[currentStep + 1].title}`,
        });
      } else {
        handleSubmit();
      }
    } else {
      toast({
        variant: "destructive",
        title: "Please check your input",
        description: "Some required fields are missing or invalid.",
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const { error } = await submitApplication({
      company_name: step1Data.companyName,
      ein: step1Data.ein,
      use_case: step2Data.useCase,
      monthly_volume: step2Data.monthlyVolume,
      tos_url: step3Data.tosUrl,
      privacy_url: step3Data.privacyUrl,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message,
      });
      setIsSubmitting(false);
    } else {
      toast({
        title: "Application submitted!",
        description: "Your KYB application is now under review.",
      });
      refetchApplication?.();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <GlassCard
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Business Application</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="text-foreground">{userData.firstName}</span>. Complete your KYB verification.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-center">
              <StepIndicator
                isActive={currentStep === index}
                isCompleted={currentStep > index}
                stepNumber={index + 1}
                title={step.title}
              />
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-12 lg:w-20 mx-4 transition-colors ${
                    currentStep > index ? "bg-success" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 min-h-[200px]"
          >
            {currentStep === 0 && (
              <>
                <RecessedInput
                  label="Legal Company Name"
                  placeholder="Acme Corporation, Inc."
                  value={step1Data.companyName}
                  onChange={(e) => setStep1Data((prev) => ({ ...prev, companyName: e.target.value }))}
                  error={errors.companyName}
                  isValid={step1Data.companyName.length > 2}
                />
                <EINInputWithTooltip
                  value={step1Data.ein}
                  onChange={(value) => setStep1Data((prev) => ({ ...prev, ein: value }))}
                  error={errors.ein}
                  isValid={einSchema.safeParse(step1Data.ein).success}
                />
              </>
            )}

            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Primary Use Case</label>
                  <Select
                    value={step2Data.useCase}
                    onValueChange={(value) => setStep2Data((prev) => ({ ...prev, useCase: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-[hsl(var(--surface-recessed))] border-border shadow-recessed">
                      <SelectValue placeholder="Select your use case" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="kyc">KYC Verification</SelectItem>
                      <SelectItem value="age">Age Verification</SelectItem>
                      <SelectItem value="identity">Identity Authentication</SelectItem>
                      <SelectItem value="fraud">Fraud Prevention</SelectItem>
                      <SelectItem value="compliance">Regulatory Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.useCase && <p className="text-xs text-destructive">{errors.useCase}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Expected Monthly Volume</label>
                  <Select
                    value={step2Data.monthlyVolume}
                    onValueChange={(value) => setStep2Data((prev) => ({ ...prev, monthlyVolume: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-[hsl(var(--surface-recessed))] border-border shadow-recessed">
                      <SelectValue placeholder="Select volume range" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="0-1000">0 - 1,000 verifications</SelectItem>
                      <SelectItem value="1000-10000">1,000 - 10,000 verifications</SelectItem>
                      <SelectItem value="10000-50000">10,000 - 50,000 verifications</SelectItem>
                      <SelectItem value="50000-100000">50,000 - 100,000 verifications</SelectItem>
                      <SelectItem value="100000+">100,000+ verifications</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.monthlyVolume && <p className="text-xs text-destructive">{errors.monthlyVolume}</p>}
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <RecessedInput
                  label="Terms of Service URL"
                  placeholder="https://yourcompany.com/terms"
                  value={step3Data.tosUrl}
                  onChange={(e) => setStep3Data((prev) => ({ ...prev, tosUrl: e.target.value }))}
                  error={errors.tosUrl}
                  isValid={step3Data.tosUrl.startsWith("http")}
                />
                <RecessedInput
                  label="Privacy Policy URL"
                  placeholder="https://yourcompany.com/privacy"
                  value={step3Data.privacyUrl}
                  onChange={(e) => setStep3Data((prev) => ({ ...prev, privacyUrl: e.target.value }))}
                  error={errors.privacyUrl}
                  isValid={step3Data.privacyUrl.startsWith("http")}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <GradientButton onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : currentStep === steps.length - 1 ? (
              <>
                Submit Application
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </GradientButton>
        </div>
      </GlassCard>
    </div>
  );
}
