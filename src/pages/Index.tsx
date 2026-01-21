import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeroSection } from "@/components/landing/HeroSection";
import { LeadCaptureCard } from "@/components/landing/LeadCaptureCard";
import { ApplicationStepper } from "@/components/application/ApplicationStepper";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

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
    // Simulate approval after 5 seconds for demo purposes
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
              <span className="text-2xl font-bold gradient-text">Autodox</span>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
                <a href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </a>
              </div>
              <button
                onClick={() => setAppState("application")}
                className="text-sm font-medium text-primary hover:underline"
              >
                Sign In
              </button>
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

          {/* Trusted By Section */}
          <section className="py-12 border-t border-border">
            <div className="container mx-auto px-6">
              <p className="text-center text-sm text-muted-foreground mb-6">
                Trusted by leading companies worldwide
              </p>
              <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 opacity-40">
                {["Fintech Corp", "SecureBank", "TrustID", "VerifyPro", "IDShield"].map((company) => (
                  <span key={company} className="text-base lg:text-lg font-semibold text-muted-foreground">
                    {company}
                  </span>
                ))}
              </div>
            </div>
          </section>
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
