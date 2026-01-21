import { motion } from "framer-motion";
import { Shield, Zap, Globe, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  const features = [
    { icon: Shield, text: "Enterprise-grade security" },
    { icon: Zap, text: "Sub-second verification" },
    { icon: Globe, text: "200+ countries supported" },
  ];

  return (
    <div className="flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm text-muted-foreground">Trusted by 500+ enterprises</span>
        </div>

        <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] mb-6">
          <span className="text-foreground">Identity</span>
          <br />
          <span className="gradient-text">Orchestration</span>
          <br />
          <span className="text-foreground">at Scale</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
          Bridge the gap between complex compliance and frictionless user experience. 
          Verify identities in seconds, not days.
        </p>

        <div className="space-y-4 mb-10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-foreground">{feature.text}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>Free tier included</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>GDPR ready</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
