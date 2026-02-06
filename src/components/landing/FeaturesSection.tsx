import '@fontsource/ibm-plex-mono/400.css';
import { motion } from "framer-motion";
import { Activity, Globe, Code, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export function FeaturesSection() {
  return (
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">
            Why Choose Us
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Built for the next decade of data.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Experience the future of identity verification with our developer-first ecosystem.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Uptime Card - Large */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <GlassCard className="h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                99.9% Infrastructure Uptime
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Our resilient cloud infrastructure ensures your verification services are always available, even during peak global traffic.
              </p>
              {/* Chart Bars */}
              <div className="flex items-end gap-2 h-24">
                {[40, 55, 70, 85, 60, 75, 90, 65, 80, 95].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-primary/50 to-primary"
                  />
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Global Reach Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard className="h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Global Reach
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Edge deployments in 40+ regions worldwide for sub-10ms latency.
              </p>
              {/* World Map Placeholder */}
              <div className="relative h-32 rounded-xl bg-secondary/50 overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <svg viewBox="0 0 100 50" className="w-full h-full text-muted-foreground">
                    <ellipse cx="50" cy="25" rx="45" ry="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    <ellipse cx="50" cy="25" rx="35" ry="15" fill="none" stroke="currentColor" strokeWidth="0.3" />
                    <ellipse cx="50" cy="25" rx="25" ry="10" fill="none" stroke="currentColor" strokeWidth="0.2" />
                  </svg>
                </div>
                {/* Glowing dots for regions */}
                {[[20, 30], [35, 20], [50, 35], [65, 25], [80, 30]].map(([x, y], i) => (
                  <div
                    key={i}
                    className="absolute h-2 w-2 rounded-full bg-primary glow-primary animate-pulse"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  />
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* SDK Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard className="h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Code className="h-5 w-5 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Developer-First SDK
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Integrate in minutes with our robust libraries for TypeScript, Python, and Go.
              </p>
              {/* Code Block */}
              <div className="bg-[hsl(var(--surface-recessed))] rounded-xl p-4 font-mono text-xs">
                <div className="flex gap-1.5 mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <code className="text-muted-foreground">
                  <span className="text-primary">npm install</span>{" "}
                  <span className="text-foreground">@autodox/sdk</span>
                  <br />
                  <span className="text-muted-foreground">const</span>{" "}
                  <span className="text-foreground">dox</span> ={" "}
                  <span className="text-primary">new</span> Autodox();
                  <br />
                  <span className="text-muted-foreground">await</span> dox.
                  <span className="text-primary">verify</span>();
                </code>
              </div>
            </GlassCard>
          </motion.div>

          {/* Security Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <GlassCard className="h-full">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Enterprise-Grade Security
                  </h3>
                  <p className="text-muted-foreground">
                    SOC2 Type II, GDPR, and HIPAA compliant by default. Your data is encrypted at rest and in transit using AES-256 and TLS 1.3.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
