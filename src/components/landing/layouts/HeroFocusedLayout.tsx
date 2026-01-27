import { LayoutProps } from "@/types/templates";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Shield, Zap, Lock, CheckCircle } from "lucide-react";

export function HeroFocusedLayout({ copy, theme, sectionsEnabled, previewMode }: LayoutProps) {
  const primaryStyle = { color: theme.primaryColor };
  const accentStyle = { color: theme.accentColor };

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
        <section className={`relative overflow-hidden ${previewMode ? 'pt-16' : 'pt-8'} pb-24`}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              {copy.badgeText && (
                <span 
                  className="inline-block px-4 py-2 rounded-full text-sm font-medium border"
                  style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                >
                  {copy.badgeText}
                </span>
              )}
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                <span style={primaryStyle}>{copy.heroHeadline}</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                {copy.heroSubheadline}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <GradientButton size="xl">
                  {copy.primaryCtaText}
                </GradientButton>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust Badges Section */}
      {sectionsEnabled.trustBadges && (
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-6">
            <p className="text-center text-muted-foreground mb-8">{copy.trustBadgeText}</p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              {(copy.trustItems || ['Enterprise Ready', 'SOC2 Compliant', 'GDPR Ready', '99.9% Uptime']).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-5 w-5" style={accentStyle} />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {sectionsEnabled.features && (
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {(copy.featureItems || [
                { title: 'Lightning Fast', description: 'Sub-second verification with global edge network', icon: 'zap' },
                { title: 'Bank-Grade Security', description: 'End-to-end encryption with zero-trust architecture', icon: 'shield' },
                { title: 'Enterprise Ready', description: 'SOC2 Type II certified with 99.99% SLA guarantee', icon: 'lock' },
              ]).map((feature, i) => (
                <GlassCard key={i} className="text-center p-8">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${theme.primaryColor}20` }}
                  >
                    {feature.icon === 'zap' && <Zap className="h-7 w-7" style={primaryStyle} />}
                    {feature.icon === 'shield' && <Shield className="h-7 w-7" style={primaryStyle} />}
                    {feature.icon === 'lock' && <Lock className="h-7 w-7" style={primaryStyle} />}
                    {!feature.icon && <CheckCircle className="h-7 w-7" style={primaryStyle} />}
                  </div>
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
