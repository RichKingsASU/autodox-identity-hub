import { LayoutProps } from "@/types/templates";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ArrowRight, CheckCircle } from "lucide-react";

export function MinimalEnterpriseLayout({ copy, theme, sectionsEnabled, previewMode }: LayoutProps) {
  const primaryStyle = { color: theme.primaryColor };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Preview Mode Banner */}
      {previewMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-center py-2 text-sm font-medium">
          Preview Mode – Not Live
        </div>
      )}

      {/* Hero Section - Minimalist */}
      {sectionsEnabled.hero && (
        <section className={`${previewMode ? 'pt-24' : 'pt-16'} pb-32`}>
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
                {copy.heroHeadline}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {copy.heroSubheadline}
              </p>
              <div className="flex items-center gap-4 pt-4">
                <GradientButton size="lg">
                  {copy.primaryCtaText}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </GradientButton>
                <GradientButton variant="ghost" size="lg">
                  Learn More
                </GradientButton>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Clean Trust Bar */}
      {sectionsEnabled.trustBadges && (
        <section className="py-8 border-y border-border">
          <div className="container mx-auto px-6">
            <div className="flex flex-wrap justify-center gap-12 text-muted-foreground">
              {(copy.trustItems || ['Fortune 500', 'SOC2', 'Enterprise Ready', 'Global Scale']).map((item, i) => (
                <span key={i} className="text-sm font-medium tracking-wide uppercase">{item}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features - Clean Grid */}
      {sectionsEnabled.features && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Built for Enterprise</h2>
              <p className="text-lg text-muted-foreground">{copy.trustBadgeText}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {(copy.featureItems || [
                { title: 'Seamless Integration', description: 'Deploy in minutes with our REST API and SDKs for every major platform.' },
                { title: 'Enterprise Security', description: 'Bank-grade encryption and compliance with major regulatory frameworks.' },
                { title: 'Global Infrastructure', description: 'Multi-region deployment with automatic failover and 99.99% uptime.' },
                { title: 'Dedicated Support', description: 'White-glove onboarding with named account managers and 24/7 support.' },
              ]).map((feature, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5" style={primaryStyle} />
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground pl-8">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <GlassCard className="max-w-2xl mx-auto text-center p-12">
            <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of companies using our platform.
            </p>
            <GradientButton size="lg">
              {copy.primaryCtaText}
            </GradientButton>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      {sectionsEnabled.footer && (
        <footer className="py-16 border-t border-border">
          <div className="container mx-auto px-6">
            <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
              {copy.footerDisclaimer}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
