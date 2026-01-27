import { LayoutProps } from "@/types/templates";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Shield, CheckCircle, Award, FileCheck, Lock } from "lucide-react";

export function ComplianceHeavyLayout({ copy, theme, sectionsEnabled, previewMode }: LayoutProps) {
  const primaryStyle = { color: theme.primaryColor };

  const complianceBadges = copy.complianceBadges || [
    'SOC2 Type II',
    'HIPAA',
    'PCI DSS',
    'GDPR',
    'ISO 27001',
    'FedRAMP'
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
        <section className={`relative overflow-hidden ${previewMode ? 'pt-16' : 'pt-8'} pb-20`}>
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="flex justify-center gap-2 mb-6">
                <Shield className="h-8 w-8" style={primaryStyle} />
                <Award className="h-8 w-8" style={primaryStyle} />
                <FileCheck className="h-8 w-8" style={primaryStyle} />
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                <span style={primaryStyle}>{copy.heroHeadline}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                {copy.heroSubheadline}
              </p>
              <GradientButton size="lg" className="mt-6">
                {copy.primaryCtaText}
              </GradientButton>
            </div>
          </div>
        </section>
      )}

      {/* Compliance Badges Grid */}
      {sectionsEnabled.compliance && (
        <section className="py-16 border-y border-border bg-secondary/30">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-8">Industry Certifications</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {complianceBadges.map((badge, i) => (
                <GlassCard key={i} className="p-4 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2" style={primaryStyle} />
                  <span className="text-sm font-semibold">{badge}</span>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Section */}
      {sectionsEnabled.trustBadges && (
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">{copy.trustBadgeText}</h2>
              <div className="space-y-4 mt-8">
                {(copy.trustItems || [
                  'Annual third-party security audits',
                  'Continuous compliance monitoring',
                  'Encrypted data at rest and in transit',
                  'Regular penetration testing'
                ]).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" style={primaryStyle} />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
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
                { title: 'Audit Trail', description: 'Complete activity logging for compliance reviews', icon: 'file' },
                { title: 'Data Residency', description: 'Choose where your data is stored and processed', icon: 'lock' },
              ]).map((feature, i) => (
                <GlassCard key={i} className="p-6">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${theme.primaryColor}20` }}
                  >
                    <Lock className="h-6 w-6" style={primaryStyle} />
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
