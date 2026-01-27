import { LayoutProps } from "@/types/templates";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ArrowRight, CheckCircle, Sparkles, Zap, Users, TrendingUp } from "lucide-react";

export function ConversionOptimizedLayout({ copy, theme, sectionsEnabled, previewMode }: LayoutProps) {
  const primaryStyle = { color: theme.primaryColor };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Preview Mode Banner */}
      {previewMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-center py-2 text-sm font-medium">
          Preview Mode – Not Live
        </div>
      )}

      {/* Hero Section - Conversion Focused */}
      {sectionsEnabled.hero && (
        <section className={`relative ${previewMode ? 'pt-16' : 'pt-8'} pb-16`}>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="h-4 w-4" style={primaryStyle} />
                  <span className="text-sm font-medium" style={primaryStyle}>Limited Time Offer</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                  <span style={primaryStyle}>{copy.heroHeadline}</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  {copy.heroSubheadline}
                </p>
                <ul className="space-y-3">
                  {(copy.trustItems || ['Free 14-day trial', 'No credit card required', 'Cancel anytime']).map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5" style={primaryStyle} />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <GradientButton size="xl" className="w-full sm:w-auto">
                    {copy.primaryCtaText}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </GradientButton>
                </div>
                <p className="text-xs text-muted-foreground">
                  Join 10,000+ companies already using our platform
                </p>
              </div>

              {/* Lead Capture Form */}
              <GlassCard className="p-8" glow>
                <h3 className="text-2xl font-bold mb-6 text-center">Start Your Free Trial</h3>
                <form className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <input 
                      type="email" 
                      placeholder="Work Email" 
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Company Name" 
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <GradientButton className="w-full" size="lg">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </GradientButton>
                </form>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  {copy.trustBadgeText}
                </p>
              </GlassCard>
            </div>
          </div>
        </section>
      )}

      {/* Social Proof Bar */}
      {sectionsEnabled.trustBadges && (
        <section className="py-8 border-y border-border bg-secondary/30">
          <div className="container mx-auto px-6">
            <div className="flex flex-wrap justify-center gap-8 items-center">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" style={primaryStyle} />
                <span className="font-bold">10,000+</span>
                <span className="text-muted-foreground">Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" style={primaryStyle} />
                <span className="font-bold">50M+</span>
                <span className="text-muted-foreground">Verifications</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={primaryStyle} />
                <span className="font-bold">99.9%</span>
                <span className="text-muted-foreground">Success Rate</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {sectionsEnabled.features && (
        <section className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {(copy.featureItems || [
                { title: 'Quick Setup', description: 'Get started in minutes with our simple onboarding' },
                { title: 'Pay As You Go', description: 'Transparent pricing with no hidden fees' },
                { title: '24/7 Support', description: 'Expert help whenever you need it' },
              ]).map((feature, i) => (
                <GlassCard key={i} className="p-6 text-center">
                  <CheckCircle className="h-10 w-10 mx-auto mb-4" style={primaryStyle} />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of businesses already growing with our platform.
          </p>
          <GradientButton size="xl">
            {copy.primaryCtaText}
            <ArrowRight className="h-5 w-5 ml-2" />
          </GradientButton>
        </div>
      </section>

      {/* Footer */}
      {sectionsEnabled.footer && (
        <footer className="py-12 border-t border-border">
          <div className="container mx-auto px-6">
            <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
              {copy.footerDisclaimer}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
