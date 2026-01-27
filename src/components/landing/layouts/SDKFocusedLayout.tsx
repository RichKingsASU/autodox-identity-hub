import { LayoutProps } from "@/types/templates";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Code2, Terminal, BookOpen, Cpu, Braces, FileCode } from "lucide-react";

export function SDKFocusedLayout({ copy, theme, sectionsEnabled, previewMode }: LayoutProps) {
  const primaryStyle = { color: theme.primaryColor };

  const codeExample = `// Initialize the SDK
import { Autodox } from '@autodox/sdk';

const client = new Autodox({
  apiKey: process.env.AUTODOX_API_KEY
});

// Verify a user
const result = await client.verify({
  phone: '+1234567890',
  method: 'sms'
});

console.log(result.verified); // true`;

  const sdks = [
    { name: 'JavaScript', icon: Braces },
    { name: 'Python', icon: FileCode },
    { name: 'Go', icon: Terminal },
    { name: 'Ruby', icon: Code2 },
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
        <section className={`${previewMode ? 'pt-16' : 'pt-8'} pb-16`}>
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-sm">
                  <Terminal className="h-4 w-4" style={primaryStyle} />
                  <span>Developer First</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                  <span style={primaryStyle}>{copy.heroHeadline}</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  {copy.heroSubheadline}
                </p>
                <div className="flex gap-4">
                  <GradientButton size="lg">{copy.primaryCtaText}</GradientButton>
                  <GradientButton variant="outline" size="lg">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Docs
                  </GradientButton>
                </div>
              </div>
              <GlassCard className="p-0 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-muted-foreground">quickstart.ts</span>
                </div>
                <pre className="p-4 text-sm overflow-x-auto font-mono text-muted-foreground">
                  <code>{codeExample}</code>
                </pre>
              </GlassCard>
            </div>
          </div>
        </section>
      )}

      {/* SDK Section */}
      {sectionsEnabled.trustBadges && (
        <section className="py-12 border-y border-border">
          <div className="container mx-auto px-6">
            <p className="text-center text-muted-foreground mb-6">{copy.trustBadgeText}</p>
            <div className="flex flex-wrap justify-center gap-6">
              {sdks.map((sdk, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50">
                  <sdk.icon className="h-5 w-5" style={primaryStyle} />
                  <span className="font-medium">{sdk.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {sectionsEnabled.features && (
        <section className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Developer Experience</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {(copy.featureItems || [
                { title: 'Type-Safe SDKs', description: 'Full TypeScript support with autocomplete and type inference' },
                { title: 'Webhooks', description: 'Real-time event notifications for all verification states' },
                { title: 'Sandbox Mode', description: 'Test your integration without incurring charges' },
              ]).map((feature, i) => (
                <GlassCard key={i} className="p-6">
                  <Cpu className="h-8 w-8 mb-4" style={primaryStyle} />
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* API Reference CTA */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Comprehensive API Documentation</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            OpenAPI spec, Postman collections, and interactive API explorer included.
          </p>
          <GradientButton>
            <Code2 className="h-4 w-4 mr-2" />
            Explore API Reference
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
