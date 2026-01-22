import { motion } from "framer-motion";
import { Key, MessageSquare, BarChart3, Users, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Key,
    title: "API Keys",
    description: "Generate and manage production and development API keys",
  },
  {
    icon: MessageSquare,
    title: "SMS Logs",
    description: "Track all verification messages with real-time delivery status",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Monitor verification success rates and usage patterns",
  },
  {
    icon: Users,
    title: "Contacts",
    description: "Manage your customer database and verification history",
  },
];

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Overview() {
  const navigate = useNavigate();
  const { profile, application } = useAuth();
  const isApproved = application?.status === "approved";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8"
    >
      {/* Welcome Hero */}
      <motion.div
        variants={fadeInUp}
        className="relative overflow-hidden rounded-3xl p-8 lg:p-12"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
        }}
      >
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Welcome back, {profile?.first_name || "there"}! 👋
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">
            {isApproved
              ? "Your account is fully verified. Start processing verifications today."
              : "Complete your business verification to unlock all features."}
          </p>
          
          {!isApproved && (
            <Button
              onClick={() => navigate("/application")}
              className="mt-6 bg-white text-primary hover:bg-white/90 font-semibold"
            >
              Complete Application
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Background pattern */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,white_1px,transparent_1px)] bg-[length:24px_24px]" />
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div variants={fadeInUp}>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          What You'll Get Access To
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <GlassCard key={feature.title} className="p-6 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </GlassCard>
          ))}
        </div>
      </motion.div>

      {/* Quick Review Process */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="p-6 lg:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Quick Review Process
              </h3>
              <p className="text-muted-foreground mb-4">
                Our team reviews applications within 1-2 business days. Once approved, you'll have
                immediate access to all platform features including API keys and analytics.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Submit application</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>1-2 day review</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Instant access</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
