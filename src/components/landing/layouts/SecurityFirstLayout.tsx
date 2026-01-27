import { LayoutProps } from "@/types/templates";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Shield, Lock, Key, Fingerprint, Eye, ShieldCheck, AlertTriangle } from "lucide-react";

export function SecurityFirstLayout({ copy, theme, sectionsEnabled, previewMode }: LayoutProps) {
  const primaryStyle = { color: theme.primaryColor };

  const securityFeatures = [
    { icon: Lock, title: 'AES-256 Encryption', desc: 'Data encrypted at rest and in transit' },
    { icon: Key, title: 'Zero-Knowledge', desc: 'We never store your sensitive data' },
    { icon: Fingerprint, title: 'Biometric Auth', desc: 'Multi-factor authentication options' },
    { icon: Eye, title: 'Audit Logging', desc: 'Complete visibility into all actions' },
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
        <section className={`relative ${previewMode ? 'pt-16' : 'pt-8'} pb-20`}>
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Bank-Grade Security</span>
              </div>
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

      {/* Security Grid */}
      {sectionsEnabled.trustBadges && (
        <section className="py-16 border-y border-border">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {securityFeatures.map((feature, i) => (
                <GlassCard key={i} className="p-4 text-center">
                  <feature.icon className="h-8 w-8 mx-auto mb-2" style={primaryStyle} />
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Compliance Section */}
      {sectionsEnabled.compliance && (
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <Shield className="h-16 w-16 mx-auto mb-4" style={primaryStyle} />
              <h2 className="text-3xl font-bold mb-4">{copy.trustBadgeText}</h2>
              <p className="text-muted-foreground">
                Built with security-first architecture from day one.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {(copy.complianceBadges || ['SOC2 Type II', 'ISO 27001', 'GDPR', 'CCPA', 'HIPAA', 'PCI DSS']).map((badge, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                  <ShieldCheck className="h-5 w-5" style={primaryStyle} />
                  <span className="font-medium">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {sectionsEnabled.features && (
        <section className="py-20 bg-secondary/20">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8">
              {(copy.featureItems || [
                { title: 'Threat Detection', description: 'Real-time monitoring and anomaly detection powered by machine learning' },
                { title: 'Penetration Testing', description: 'Regular third-party security assessments and bug bounty program' },
              ]).map((feature, i) => (
                <GlassCard key={i} className="p-8">
                  <AlertTriangle className="h-10 w-10 mb-4" style={primaryStyle} />
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <GlassCard className="max-w-2xl mx-auto p-12" glow>
            <Lock className="h-12 w-12 mx-auto mb-4" style={primaryStyle} />
            <h2 className="text-2xl font-bold mb-4">Your Security is Our Priority</h2>
            <p className="text-muted-foreground mb-6">
              Request our security whitepaper and compliance documentation.
            </p>
            <GradientButton>Request Security Docs</GradientButton>
          </GlassCard>
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
