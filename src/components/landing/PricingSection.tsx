import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "Perfect for hobbyists and solo developers.",
    features: [
      { text: "5 Projects", included: true },
      { text: "1GB Storage", included: true },
      { text: "Community Support", included: true },
      { text: "Custom Domains", included: false },
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "For teams scaling their global presence.",
    features: [
      { text: "Unlimited Projects", included: true },
      { text: "100GB Storage", included: true },
      { text: "Priority Support", included: true },
      { text: "Custom Domains & SSL", included: true },
      { text: "Advanced Analytics", included: true },
    ],
    cta: "Get Pro Access",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Full control for large-scale operations.",
    features: [
      { text: "Dedicated Clusters", included: true },
      { text: "SLA Guarantees", included: true },
      { text: "Custom Integrations", included: true },
      { text: "Dedicated Account Manager", included: true },
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 border-t border-border">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">
            Pricing
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Simple, scalable plans.
          </h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground uppercase tracking-wide">
                    Recommended
                  </span>
                </div>
              )}
              <GlassCard
                className={`h-full flex flex-col ${
                  plan.highlighted
                    ? "border-primary/50 bg-card/80"
                    : ""
                }`}
                glow={plan.highlighted}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span
                        className={
                          feature.included
                            ? "text-sm text-foreground"
                            : "text-sm text-muted-foreground/50"
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.highlighted ? (
                  <GradientButton className="w-full">
                    {plan.cta} →
                  </GradientButton>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-border hover:bg-secondary"
                  >
                    {plan.cta}
                  </Button>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
