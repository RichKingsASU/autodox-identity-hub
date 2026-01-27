import { LayoutProps } from "@/types/templates";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Star, Users, Building2, Globe, TrendingUp, Quote } from "lucide-react";

export function TrustSignalDenseLayout({ copy, theme, sectionsEnabled, previewMode }: LayoutProps) {
  const primaryStyle = { color: theme.primaryColor };

  const stats = [
    { value: '10M+', label: 'Verifications', icon: Users },
    { value: '500+', label: 'Enterprise Clients', icon: Building2 },
    { value: '99.99%', label: 'Uptime SLA', icon: TrendingUp },
    { value: '150+', label: 'Countries', icon: Globe },
  ];

  const testimonials = [
    { quote: 'Reduced our verification time by 80%', author: 'VP Engineering, Fortune 500' },
    { quote: 'The most reliable identity platform we have used', author: 'CTO, Series B Startup' },
    { quote: 'Enterprise-grade with startup-level ease', author: 'Head of Product, Fintech' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Preview Mode Banner */}
      {previewMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-center py-2 text-sm font-medium">
          Preview Mode – Not Live
        </div>
      )}

      {/* Hero Section */}
      {sectionsEnabled.hero && (
        <section className={`relative ${previewMode ? 'pt-16' : 'pt-8'} pb-16`}>
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Trusted by 500+ companies worldwide</p>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                <span style={primaryStyle}>{copy.heroHeadline}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {copy.heroSubheadline}
              </p>
              <GradientButton size="lg">{copy.primaryCtaText}</GradientButton>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      {sectionsEnabled.trustBadges && (
        <section className="py-12 border-y border-border bg-secondary/30">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <stat.icon className="h-8 w-8 mx-auto mb-2" style={primaryStyle} />
                  <div className="text-3xl font-bold" style={primaryStyle}>{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Logos Section */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground mb-6">{copy.trustBadgeText}</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-50">
            {(copy.trustItems || ['Acme Corp', 'TechCo', 'StartupX', 'Enterprise Inc', 'GlobalFin']).map((item, i) => (
              <span key={i} className="text-lg font-bold">{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {sectionsEnabled.testimonials && (
        <section className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Clients Say</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <GlassCard key={i} className="p-6">
                  <Quote className="h-8 w-8 mb-4" style={primaryStyle} />
                  <p className="text-lg font-medium mb-4">"{testimonial.quote}"</p>
                  <p className="text-sm text-muted-foreground">{testimonial.author}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {sectionsEnabled.features && (
        <section className="py-20 bg-secondary/20">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-6">
              {(copy.featureItems || [
                { title: 'Instant Verification', description: 'Real-time identity checks in under 2 seconds' },
                { title: 'Global Coverage', description: 'Support for 150+ countries and territories' },
                { title: 'Smart Fraud Detection', description: 'AI-powered risk assessment and prevention' },
              ]).map((feature, i) => (
                <GlassCard key={i} className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}

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
