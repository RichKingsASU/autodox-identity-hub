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
import { AuthModal } from "@/components/auth/AuthModal";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, application, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
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
  const redirectHandled = useRef(false);

  // Role-based redirect after login
  useEffect(() => {
    if (!user || adminLoading || loading || redirectHandled.current) return;

    if (isAdmin) {
      redirectHandled.current = true;
      navigate("/admin");
    } else if (application) {
      // User has an application, redirect to dashboard
      redirectHandled.current = true;
      navigate("/dashboard");
    } else {
      // User has no application, redirect to application page
      redirectHandled.current = true;
      navigate("/application");
    }
  }, [user, isAdmin, adminLoading, loading, application, navigate]);

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

  // Include adminLoading in loading check to prevent race condition
  // where content renders before redirect logic can execute
  const isActuallyLoading = (loading || adminLoading) && !loadingTimedOut;


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
