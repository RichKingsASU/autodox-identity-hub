import { LayoutProps } from "@/types/templates";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Globe, MapPin, Languages, Clock, Wifi, Building } from "lucide-react";

export function GlobalReachLayout({ copy, theme, sectionsEnabled, previewMode }: LayoutProps) {
  const primaryStyle = { color: theme.primaryColor };

  const regions = [
    { name: 'North America', cities: 'NYC, LA, Toronto' },
    { name: 'Europe', cities: 'London, Frankfurt, Amsterdam' },
    { name: 'Asia Pacific', cities: 'Singapore, Tokyo, Sydney' },
    { name: 'Latin America', cities: 'São Paulo, Mexico City' },
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
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <Globe className="w-[800px] h-[800px] absolute -right-48 -top-48" style={primaryStyle} />
            </div>
          </div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary">
                <Globe className="h-5 w-5" style={primaryStyle} />
                <span className="text-sm font-medium">150+ Countries Supported</span>
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

      {/* Global Stats */}
      {sectionsEnabled.trustBadges && (
        <section className="py-16 border-y border-border bg-secondary/30">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <Globe className="h-8 w-8 mx-auto mb-2" style={primaryStyle} />
                <div className="text-3xl font-bold">150+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div>
                <Languages className="h-8 w-8 mx-auto mb-2" style={primaryStyle} />
                <div className="text-3xl font-bold">40+</div>
                <div className="text-sm text-muted-foreground">Languages</div>
              </div>
              <div>
                <Clock className="h-8 w-8 mx-auto mb-2" style={primaryStyle} />
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-muted-foreground">Global Support</div>
              </div>
              <div>
                <Wifi className="h-8 w-8 mx-auto mb-2" style={primaryStyle} />
                <div className="text-3xl font-bold">99.99%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Regions Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">{copy.trustBadgeText}</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Data centers strategically located for optimal latency worldwide.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {regions.map((region, i) => (
              <GlassCard key={i} className="p-6">
                <MapPin className="h-6 w-6 mb-3" style={primaryStyle} />
                <h3 className="font-bold mb-1">{region.name}</h3>
                <p className="text-sm text-muted-foreground">{region.cities}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      {sectionsEnabled.features && (
        <section className="py-20 bg-secondary/20">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {(copy.featureItems || [
                { title: 'Local Compliance', description: 'Meet regional data protection requirements automatically' },
                { title: 'Multi-Currency', description: 'Bill in local currencies with transparent pricing' },
                { title: 'Edge Routing', description: 'Automatic routing to nearest data center for speed' },
              ]).map((feature, i) => (
                <GlassCard key={i} className="p-6 text-center">
                  <Building className="h-8 w-8 mx-auto mb-4" style={primaryStyle} />
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
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
