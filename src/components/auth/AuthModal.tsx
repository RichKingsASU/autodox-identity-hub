import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { RecessedInput } from "@/components/ui/RecessedInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, ArrowRight, X, Wand2 } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { EmailVerificationScreen } from "./EmailVerificationScreen";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { PasswordGenerator } from "@/components/ui/PasswordGenerator";

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup" | "forgot";
  onSuccess?: () => void;
  prefillData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode = "signin",
  onSuccess,
  prefillData 
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode === "forgot" ? "forgot" : initialMode);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: prefillData?.firstName || "",
    lastName: prefillData?.lastName || "",
    email: prefillData?.email || "",
    phone: prefillData?.phone || "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    // Clear confirmPassword error when either password field changes
    if ((field === "password" || field === "confirmPassword") && errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleGeneratedPassword = (password: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      password, 
      confirmPassword: password 
    }));
    setErrors((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    setGeneratorOpen(false);
  };

  const passwordsMatch = formData.password && formData.confirmPassword && 
    formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      if (mode === "forgot") {
        const result = forgotSchema.safeParse({ email: formData.email });
        if (!result.success) {
          const newErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(newErrors);
          setIsSubmitting(false);
          return;
        }

        const { error } = await resetPassword(formData.email);

        if (error) {
          toast({
            variant: "destructive",
            title: "Reset failed",
            description: error.message,
          });
        } else {
          setResetSent(true);
          toast({
            title: "Reset link sent!",
            description: "Check your email for the password reset link.",
          });
        }
      } else if (mode === "signup") {
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
          const newErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(newErrors);
          setIsSubmitting(false);
          return;
        }

        const { error, data } = await signUp(formData.email, formData.password, {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message,
          });
        } else if (data?.session) {
          toast({
            title: "Account created!",
            description: "Welcome to Autodox.",
          });
          onSuccess?.();
          onClose();
        } else {
          setVerificationEmail(formData.email);
          setShowVerification(true);
        }
      } else {
        const result = signInSchema.safeParse(formData);
        if (!result.success) {
          const newErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(newErrors);
          setIsSubmitting(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message,
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          onSuccess?.();
          onClose();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (showVerification) {
    return (
      <EmailVerificationScreen
        email={verificationEmail}
        onBack={() => {
          setShowVerification(false);
          setMode("signin");
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <GlassCard
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              {mode === "signup" ? "Create Account" : mode === "forgot" ? "Reset Password" : "Welcome Back"}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {mode === "signup" ? "Sign Up" : mode === "forgot" ? "Forgot Password" : "Sign In"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === "signup"
              ? "Create your account to start your identity verification journey."
              : mode === "forgot"
              ? "Enter your email and we'll send you a link to reset your password."
              : "Sign in to access your dashboard and applications."}
          </p>
        </div>

        {mode === "forgot" && resetSent ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Check your email</h3>
            <p className="text-sm text-muted-foreground mb-6">
              We've sent a password reset link to <strong>{formData.email}</strong>
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setMode("signin");
                setResetSent(false);
              }}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </motion.div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <RecessedInput
                        label="First Name"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        error={errors.firstName}
                      />
                      <RecessedInput
                        label="Last Name"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        error={errors.lastName}
                      />
                    </div>
                    <RecessedInput
                      label="Phone Number"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      error={errors.phone}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <RecessedInput
                label="Email Address"
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={errors.email}
              />

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      Password
                    </label>
                    {mode === "signup" && (
                      <Popover open={generatorOpen} onOpenChange={setGeneratorOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs text-primary hover:text-primary"
                          >
                            <Wand2 className="h-3 w-3 mr-1" />
                            Generate
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Password Generator</h4>
                            <p className="text-xs text-muted-foreground">
                              Generate a strong, secure password
                            </p>
                            <PasswordGenerator 
                              onSelect={handleGeneratedPassword} 
                              defaultLength={16}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <PasswordInput
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    error={errors.password}
                  />
                  {mode === "signup" && formData.password && (
                    <PasswordStrengthMeter password={formData.password} />
                  )}
                  {mode === "signin" && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <PasswordInput
                      label="Confirm Password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      error={errors.confirmPassword}
                      isValid={passwordsMatch}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <GradientButton
                type="submit"
                size="lg"
                className="w-full mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                ) : (
                  <>
                    {mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Reset Link" : "Sign In"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </GradientButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("signin")}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign In
                    </button>
                  </>
                ) : mode === "forgot" ? (
                  <>
                    Remember your password?{" "}
                    <button
                      onClick={() => setMode("signin")}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button
                      onClick={() => setMode("signup")}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </GlassCard>
    </motion.div>
  );
}
