import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationScreenProps {
  email: string;
  onBack: () => void;
  onClose: () => void;
}

export function EmailVerificationScreen({ 
  email, 
  onBack, 
  onClose 
}: EmailVerificationScreenProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { toast } = useToast();

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to resend",
          description: error.message,
        });
      } else {
        setResendSuccess(true);
        toast({
          title: "Email sent!",
          description: "Check your inbox for the verification link.",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

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
        className="w-full max-w-md relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated mail icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
          className="mx-auto mb-6 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Mail className="h-10 w-10 text-primary" />
          </motion.div>
        </motion.div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          Check Your Email
        </h2>
        
        <p className="text-muted-foreground mb-2">
          We've sent a verification link to
        </p>
        
        <p className="text-foreground font-medium mb-6 break-all">
          {email}
        </p>

        <div className="bg-secondary/50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-foreground mb-2">
            Next steps:
          </h3>
          <ol className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                1
              </span>
              <span>Open the email from Autodox</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                2
              </span>
              <span>Click the verification link</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                3
              </span>
              <span>Return here to sign in and continue</span>
            </li>
          </ol>
        </div>

        <div className="space-y-3">
          <GradientButton
            onClick={handleResend}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="h-4 w-4" />
              </motion.div>
            ) : resendSuccess ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Email Sent
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </GradientButton>

          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Didn't receive the email? Check your spam folder or try resending.
        </p>
      </GlassCard>
    </motion.div>
  );
}
