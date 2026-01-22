import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Terminal } from "lucide-react";
import { HeroSection } from "@/components/landing/HeroSection";
import { LeadCaptureCard } from "@/components/landing/LeadCaptureCard";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { BlogSection } from "@/components/landing/BlogSection";
import { Footer } from "@/components/landing/Footer";
import { ApplicationStepper } from "@/components/application/ApplicationStepper";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AuthModal } from "@/components/auth/AuthModal";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";

type AppState = "landing" | "application" | "dashboard";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, application, loading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [prefillData, setPrefillData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }>({});
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const welcomeToastShown = useRef(false);
  const previousStatusRef = useRef<string | null>(null);
  const redirectHandled = useRef(false);

  // Role-based redirect after login
  useEffect(() => {
    if (!user || adminLoading || redirectHandled.current) return;
    
    // Only redirect if user has an approved application or is admin
    if (isAdmin) {
      redirectHandled.current = true;
      navigate("/admin");
    } else if (user) {
      // Redirect authenticated users to dashboard
      redirectHandled.current = true;
      navigate("/dashboard");
    }
  }, [user, isAdmin, adminLoading, navigate]);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    if (loading && !loadingTimedOut) {
      timeoutRef.current = setTimeout(() => {
        setLoadingTimedOut(true);
      }, 3000);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading, loadingTimedOut]);

  const isActuallyLoading = loading && !loadingTimedOut;

  // Determine app state based on auth and application status
  const getAppState = (): AppState => {
    if (!user) return "landing";
    if (!application) return "application";
    return "dashboard";
  };

  const appState = isActuallyLoading ? "landing" : getAppState();
  const isPending = application?.status === "pending";

  // Show welcome toast when user first arrives at dashboard
  useEffect(() => {
    if (appState === "dashboard" && !welcomeToastShown.current) {
      welcomeToastShown.current = true;
      toast({
        title: isPending ? "Application submitted!" : "Welcome back!",
        description: isPending 
          ? "Your application is under review. We'll notify you once approved."
          : "Your dashboard is ready. Start processing verifications.",
      });
    }
  }, [appState, isPending, toast]);

  // Real-time status change notifications
  useEffect(() => {
    const currentStatus = application?.status ?? null;
    
    if (previousStatusRef.current !== null && currentStatus !== null) {
      if (previousStatusRef.current === "pending" && currentStatus === "approved") {
        toast({
          title: "🎉 Application Approved!",
          description: "Congratulations! You now have full access to all features.",
        });
      } else if (previousStatusRef.current === "pending" && currentStatus === "rejected") {
        toast({
          variant: "destructive",
          title: "Application Not Approved",
          description: "Please contact support for more information.",
        });
      }
    }
    
    previousStatusRef.current = currentStatus;
  }, [application?.status, toast]);

  const handleLeadComplete = (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) => {
    setPrefillData(data);
    setAuthMode("signup");
    setShowAuthModal(true);
  };

  const handleLoginClick = () => {
    setAuthMode("signin");
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    }
  };

  if (isActuallyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {appState === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-background"
          >
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
              <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold text-foreground">Autodox</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                  <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </a>
                  <a href="#developers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Developers
                  </a>
                  <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </a>
                  <a href="#enterprise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Enterprise
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  {import.meta.env.DEV && (
                    <button
                      onClick={() => navigate("/admin")}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-colors"
                    >
                      <Terminal className="h-3.5 w-3.5" />
                      Dev
                    </button>
                  )}
                  <GradientButton size="sm" onClick={handleLoginClick}>
                    Login
                  </GradientButton>
                </div>
              </div>
            </nav>

            {/* Hero Section */}
            <section className="min-h-screen pt-24 pb-12 flex items-center">
              <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                  <HeroSection />
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex justify-center lg:justify-end"
                  >
                    <LeadCaptureCard onComplete={handleLeadComplete} />
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <FeaturesSection />

            {/* Pricing Section */}
            <PricingSection />

            {/* Blog Section */}
            <BlogSection />

            {/* Footer */}
            <Footer />
          </motion.div>
        )}

        {appState === "application" && user && (
          <motion.div
            key="application"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <ApplicationStepper
              userData={{
                firstName: profile?.first_name || "",
                lastName: profile?.last_name || "",
                email: profile?.email || user.email || "",
                phone: profile?.phone || "",
              }}
            />
          </motion.div>
        )}

        {appState === "dashboard" && user && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DashboardShell
              isPending={isPending}
              userName={profile?.first_name || "User"}
              onSignOut={handleSignOut}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => setShowAuthModal(false)}
            initialMode={authMode}
            prefillData={prefillData}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Index;
