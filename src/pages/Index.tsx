import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { HeroSection } from "@/components/landing/HeroSection";
import { LeadCaptureCard } from "@/components/landing/LeadCaptureCard";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";
import { ApplicationStepper } from "@/components/application/ApplicationStepper";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { GradientButton } from "@/components/ui/GradientButton";

type AppState = "landing" | "application" | "dashboard-pending" | "dashboard-active";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("landing");
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const handleLeadComplete = (data: typeof userData) => {
    setUserData(data);
    setAppState("application");
  };

  const handleApplicationComplete = () => {
    setAppState("dashboard-pending");
    setTimeout(() => {
      setAppState("dashboard-active");
    }, 5000);
  };

  return (
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
              <GradientButton
                size="sm"
                onClick={() => setAppState("application")}
              >
                Login
              </GradientButton>
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

          {/* Footer */}
          <Footer />
        </motion.div>
      )}

      {appState === "application" && (
        <motion.div
          key="application"
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.5 }}
          style={{ perspective: 1000 }}
        >
          <ApplicationStepper
            userData={userData}
            onComplete={handleApplicationComplete}
          />
        </motion.div>
      )}

      {(appState === "dashboard-pending" || appState === "dashboard-active") && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <DashboardShell
            isPending={appState === "dashboard-pending"}
            userName={userData.firstName || "User"}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Index;
