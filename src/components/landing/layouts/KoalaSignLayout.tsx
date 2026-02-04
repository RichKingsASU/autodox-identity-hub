import { LayoutProps } from "@/types/templates";
import { AnimatedSection } from "../AnimatedSection";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Leaf,
  Sparkles,
  FileText,
  CheckCircle2,
  Lock,
  Globe,
  Zap,
  Users,
  Check,
  Star,
  ChevronDown,
  Mail,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  lock: Lock,
  globe: Globe,
  zap: Zap,
  users: Users,
  check: CheckCircle2,
};

export function KoalaSignLayout({ copy, theme, sectionsEnabled, previewMode }: LayoutProps) {
  const [isLoaded, setIsLoaded] = useState(true);

  // Default features if none provided
  const features = copy.featureItems || [
    { title: "Bank-Grade Security", description: "Your documents are protected with AES-256 encryption.", icon: "shield", large: true },
    { title: "Lightning Fast", description: "Verify documents in under 3 seconds.", icon: "zap" },
    { title: "Global Compliance", description: "GDPR, SOC 2, and HIPAA ready.", icon: "globe" },
    { title: "Instant Verification", description: "Verify document authenticity in seconds.", icon: "check" },
    { title: "Audit Trails", description: "Complete activity history for every document.", icon: "lock" },
    { title: "Team Collaboration", description: "Work together with role-based permissions.", icon: "users" },
  ];

  // Default pricing plans
  const pricingPlans = copy.pricingPlans || [
    { name: "Free", price: "$0", period: "forever", description: "Perfect for individuals", features: ["Up to 5 documents/month", "Basic verification", "Email support"], cta: "Get Started" },
    { name: "Starter", price: "$12", period: "/month", description: "For small teams", features: ["Up to 50 documents/month", "Advanced verification", "Priority support", "Up to 5 users"], cta: "Start Free Trial" },
    { name: "Professional", price: "$49", period: "/month", description: "For growing businesses", features: ["Unlimited documents", "Full verification suite", "24/7 support", "Up to 25 users", "API access"], cta: "Start Free Trial", popular: true },
    { name: "Enterprise", price: "Custom", period: "", description: "For large organizations", features: ["Everything in Pro", "Unlimited users", "Dedicated manager", "Custom integrations", "SLA guarantee"], cta: "Contact Sales" },
  ];

  // Default FAQs
  const faqs = copy.faqs || [
    { question: "Is it legally binding?", answer: "Yes, our e-signatures are legally binding in most countries, compliant with ESIGN, UETA, and eIDAS regulations." },
    { question: "How secure is my data?", answer: "We use AES-256 encryption, the same standard used by banks and government agencies." },
    { question: "Can I try it for free?", answer: "Yes! Our free plan includes 5 documents per month with full verification features." },
    { question: "What file formats are supported?", answer: "We support PDF, DOCX, PNG, JPG, and many other common formats." },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Mesh gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, ${theme.primaryColor}15 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, ${theme.accentColor}10 0%, transparent 40%),
            radial-gradient(ellipse at 50% 80%, hsl(215 30% 96%) 0%, transparent 50%),
            hsl(152 40% 98%)
          `,
        }}
      />

      {/* Preview Mode Banner */}
      {previewMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-center py-2 text-sm font-medium">
          Preview Mode – Not Live
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed ${previewMode ? 'top-10' : 'top-4'} left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl`}>
        <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-full px-6 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Shield className="h-7 w-7" style={{ color: theme.primaryColor }} />
                <Leaf className="h-3 w-3 absolute -bottom-0.5 -right-0.5" style={{ color: theme.primaryColor }} />
              </div>
              <span className="font-bold text-xl tracking-tight">{copy.brandName || "KoalaSign"}</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {sectionsEnabled.features && <button className="text-muted-foreground hover:text-foreground transition-colors font-medium">Features</button>}
              {sectionsEnabled.pricing && <button className="text-muted-foreground hover:text-foreground transition-colors font-medium">Pricing</button>}
              {sectionsEnabled.faq && <button className="text-muted-foreground hover:text-foreground transition-colors font-medium">FAQ</button>}
            </div>
            <Button style={{ backgroundColor: theme.primaryColor }}>
              {copy.primaryCtaText || "Get Started"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {sectionsEnabled.hero && (
        <section className={`min-h-screen flex items-center justify-center ${previewMode ? 'pt-36' : 'pt-28'} pb-20 px-4 relative`}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: `${theme.primaryColor}20` }} />
            <div className="absolute top-40 right-20 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: `${theme.accentColor}15`, animationDelay: '2s' }} />
          </div>

          <div className="max-w-6xl mx-auto text-center relative z-10">
            {copy.badgeText && (
              <AnimatedSection delay={0}>
                <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-white/30 rounded-full px-4 py-2 mb-8 shadow-lg">
                  <Sparkles className="h-4 w-4" style={{ color: theme.primaryColor }} />
                  <span className="text-sm font-medium text-muted-foreground">{copy.badgeText}</span>
                </div>
              </AnimatedSection>
            )}

            <AnimatedSection delay={100}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter mb-6">
                {copy.heroHeadline}
                {copy.heroHeadlineAccent && (
                  <>
                    <br />
                    <span style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {copy.heroHeadlineAccent}
                    </span>
                  </>
                )}
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
                {copy.heroSubheadline}
              </p>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                <Button size="lg" style={{ backgroundColor: theme.primaryColor }}>
                  {copy.primaryCtaText || "Get Started Free"}
                </Button>
                {copy.secondaryCtaText && (
                  <Button size="lg" variant="outline">
                    {copy.secondaryCtaText}
                  </Button>
                )}
              </div>
            </AnimatedSection>

            {/* Document Mockup */}
            <AnimatedSection delay={400} animation="scale">
              <div className="relative max-w-lg mx-auto">
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl" style={{ background: `linear-gradient(to br, ${theme.primaryColor}20, ${theme.accentColor}20)` }}>
                      <FileText className="h-8 w-8" style={{ color: theme.primaryColor }} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg tracking-tight">Service Agreement</h3>
                      <p className="text-sm text-muted-foreground">contract_2024.pdf</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    {[100, 83, 66, 100, 75].map((width, i) => (
                      <div key={i} className="h-3 bg-gradient-to-r from-slate-200/50 to-slate-100/50 rounded-full" style={{ width: `${width}%` }} />
                    ))}
                  </div>
                  <div className="border-t-2 border-dashed border-slate-200/50 pt-4">
                    <div className="h-10 bg-gradient-to-r from-slate-100/50 to-white/50 rounded-xl flex items-center justify-center border border-slate-200/30">
                      <span className="text-sm text-muted-foreground italic font-medium">Signature</span>
                    </div>
                  </div>
                  <div className="absolute -top-5 -right-5 text-white rounded-2xl p-4 shadow-lg" style={{ background: `linear-gradient(to r, ${theme.primaryColor}, ${theme.accentColor})` }}>
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Features Section */}
      {sectionsEnabled.features && (
        <section className="py-24 px-4 relative">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <span className="inline-block text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: theme.primaryColor }}>
                {copy.featuresSectionTitle || "Features"}
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tighter">
                Protected at Every Step
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {copy.featuresSectionSubtitle || "Enterprise-grade security features that keep your documents safe."}
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon || 'check'] || CheckCircle2;
                return (
                  <AnimatedSection key={index} delay={index * 75} className={feature.large ? 'md:col-span-2 lg:col-span-2' : ''}>
                    <div className={`group relative bg-white/70 backdrop-blur-xl rounded-3xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden ${feature.large ? 'p-10' : 'p-8'}`}>
                      <div className="relative z-10">
                        <div className={`inline-flex p-4 rounded-2xl mb-5 transition-transform duration-300 group-hover:scale-110`} style={{ background: `linear-gradient(to br, ${theme.primaryColor}20, ${theme.accentColor}20)` }}>
                          <IconComponent className={feature.large ? "h-10 w-10" : "h-7 w-7"} style={{ color: theme.primaryColor }} />
                        </div>
                        <h3 className={`font-bold mb-3 tracking-tight ${feature.large ? "text-2xl md:text-3xl" : "text-xl"}`}>
                          {feature.title}
                        </h3>
                        <p className={`text-muted-foreground leading-relaxed ${feature.large ? "text-base md:text-lg" : "text-sm"}`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      {sectionsEnabled.pricing && (
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-1/2" style={{ backgroundColor: `${theme.primaryColor}15` }} />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedSection className="text-center mb-16">
              <span className="inline-block text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: theme.primaryColor }}>Pricing</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tighter">
                {copy.pricingSectionTitle || "Simple, Transparent Pricing"}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {copy.pricingSectionSubtitle || "Choose the plan that fits your needs."}
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingPlans.map((plan, index) => (
                <AnimatedSection key={index} delay={index * 75} animation={plan.popular ? "scale" : "fade-up"}>
                  <div className={`relative bg-white/70 backdrop-blur-xl rounded-3xl p-7 border shadow-lg transition-all duration-300 h-full flex flex-col ${plan.popular ? 'border-primary/30 ring-2' : 'border-white/30'}`} style={plan.popular ? { borderColor: `${theme.primaryColor}30`, ringColor: `${theme.primaryColor}10` } : {}}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1" style={{ background: `linear-gradient(to r, ${theme.primaryColor}, ${theme.accentColor})` }}>
                        <Star className="h-3 w-3 fill-current" />
                        Most Popular
                      </div>
                    )}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold mb-2 tracking-tight">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-extrabold tracking-tighter">{plan.price}</span>
                        <span className="text-muted-foreground font-medium">{plan.period}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">{plan.description}</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="p-1 rounded-full mt-0.5" style={{ background: `linear-gradient(to br, ${theme.primaryColor}20, ${theme.accentColor}20)` }}>
                            <Check className="h-3.5 w-3.5" style={{ color: theme.primaryColor }} />
                          </div>
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"} style={plan.popular ? { backgroundColor: theme.primaryColor } : {}}>
                      {plan.cta}
                    </Button>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {sectionsEnabled.faq && (
        <section className="py-24 px-4 relative">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <span className="inline-block text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: theme.primaryColor }}>FAQ</span>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tighter">
                {copy.faqSectionTitle || "Frequently Asked Questions"}
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 px-6 shadow-sm">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {sectionsEnabled.contact && (
        <section className="py-24 px-4 relative">
          <div className="max-w-xl mx-auto">
            <AnimatedSection className="text-center mb-12">
              <span className="inline-block text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: theme.primaryColor }}>Contact</span>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tighter">
                {copy.contactSectionTitle || "Get in Touch"}
              </h2>
              <p className="text-lg text-muted-foreground">
                {copy.contactSectionSubtitle || "Have questions? We'd love to hear from you."}
              </p>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/30 p-8 shadow-lg">
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="How can we help?" />
                  </div>
                  <Button className="w-full" style={{ backgroundColor: theme.primaryColor }}>
                    Send Message
                  </Button>
                </form>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Footer */}
      {sectionsEnabled.footer && (
        <footer className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xl border-t border-white/30" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl" style={{ background: `linear-gradient(to top, ${theme.primaryColor}10, transparent)` }} />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-5">
                  <Shield className="h-8 w-8" style={{ color: theme.primaryColor }} />
                  <span className="font-bold text-2xl tracking-tight">{copy.brandName || "KoalaSign"}</span>
                </div>
                <p className="text-muted-foreground mb-6 max-w-xs leading-relaxed">
                  {copy.footerTagline || copy.heroSubheadline}
                </p>
                <div className="flex gap-3">
                  <a href="#" className="p-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/30 text-muted-foreground hover:text-primary transition-all">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="#" className="p-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/30 text-muted-foreground hover:text-primary transition-all">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href="#" className="p-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/30 text-muted-foreground hover:text-primary transition-all">
                    <Github className="h-5 w-5" />
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-5 tracking-tight">Product</h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-5 tracking-tight">Legal</h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">GDPR</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/30 pt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {copy.copyright || copy.footerDisclaimer || `© ${new Date().getFullYear()} ${copy.brandName || "KoalaSign"}. All rights reserved.`}
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
