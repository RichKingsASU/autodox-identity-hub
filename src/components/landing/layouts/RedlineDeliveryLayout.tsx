import { LayoutProps } from "@/types/templates";
import { AnimatedSection } from "../AnimatedSection";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ArrowRight,
  Zap,
  Globe,
  Shield,
  Mail,
  Send,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  Star,
  Twitter,
  Linkedin,
  Github,
  Phone,
  MapPin,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: Globe,
  message: MessageSquare,
  send: Send,
  mail: Mail,
  zap: Zap,
  shield: Shield,
  users: Users,
  chart: BarChart3,
  clock: Clock,
  check: CheckCircle2,
};

export function RedlineDeliveryLayout({ copy, theme, sectionsEnabled, previewMode }: LayoutProps) {
  // Default services
  const services = copy.services || [
    { icon: "globe", title: "Global Fleet", subtitle: "Network", description: "Worldwide delivery infrastructure with real-time tracking across 180+ countries.", size: "medium" as const },
    { icon: "message", title: "SMS Relay", subtitle: "Messaging", description: "Direct text messaging with 99.9% delivery rates.", size: "small" as const },
    { icon: "send", title: "Direct Mail", subtitle: "Physical", description: "Automated physical mail campaigns with tracking.", size: "small" as const },
    { icon: "mail", title: "Email Systems", subtitle: "Enterprise", description: "Professional email solutions with comprehensive analytics.", size: "medium" as const },
  ];

  // Default testimonials
  const testimonials = copy.testimonials || [
    { quote: "PDS transformed our customer communication. Delivery rates improved by 40%.", author: "Sarah Chen", role: "VP of Operations", company: "TechCorp" },
    { quote: "The multi-channel approach helped us reach customers we never could before.", author: "Marcus Johnson", role: "Marketing Director", company: "RetailPro" },
    { quote: "Enterprise-grade reliability with startup-friendly support. Exactly what we needed.", author: "Emily Rodriguez", role: "CTO", company: "FinanceHub" },
  ];

  // Default stats
  const stats = copy.stats || [
    { value: "180+", label: "Countries Served" },
    { value: "1B+", label: "Messages Monthly" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "24/7", label: "Support" },
  ];

  // Default trust items
  const trustItems = copy.trustItems || ["180+ Countries", "1B+ Messages/Month", "99.9% Uptime"];

  return (
    <div className="min-h-screen bg-white">
      {/* Preview Mode Banner */}
      {previewMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-center py-2 text-sm font-medium">
          Preview Mode – Not Live
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed ${previewMode ? 'top-10' : 'top-0'} left-0 right-0 z-40 transition-all duration-500 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl text-white shadow-lg transition-all duration-300" style={{ backgroundColor: theme.primaryColor }}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  {copy.brandName || "PDS"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium -mt-1 hidden md:block">
                  {copy.brandTagline || "Pro Delivery"}
                </span>
              </div>
            </a>

            <div className="hidden md:flex items-center gap-8">
              {sectionsEnabled.about && <button className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">About</button>}
              {sectionsEnabled.services && <button className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Services</button>}
              {sectionsEnabled.contact && <button className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Contact</button>}
              <Button className="rounded-full px-5 text-sm" style={{ backgroundColor: theme.primaryColor }}>
                {copy.primaryCtaText || "Get Started"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {sectionsEnabled.hero && (
        <section className={`relative min-h-screen flex flex-col justify-center items-center ${previewMode ? 'pt-28' : 'pt-20'} overflow-hidden bg-white`}>
          {/* Mesh Gradient Background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 10% 0%, ${theme.primaryColor}08, transparent 50%),
                radial-gradient(ellipse 60% 50% at 90% 10%, ${theme.accentColor}06, transparent 50%)
              `,
            }}
          />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(hsl(214 32% 91% / 0.5) 1px, transparent 1px),
                linear-gradient(90deg, hsl(214 32% 91% / 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />

          {/* Floating 3D Shape (decorative) */}
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none hidden lg:block">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 rounded-full blur-3xl" style={{ background: `linear-gradient(to br, ${theme.primaryColor}15, ${theme.accentColor}10)` }} />
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-white via-blue-50 to-indigo-100 border border-white/60 shadow-xl">
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/80 via-transparent to-transparent" />
                <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-2xl backdrop-blur-md border border-white/40 shadow-lg" style={{ background: `linear-gradient(to br, ${theme.primaryColor}30, ${theme.primaryColor}10)` }} />
                <div className="absolute bottom-1/3 right-1/4 w-12 h-12 rounded-xl backdrop-blur-md border border-white/40 shadow-lg" style={{ background: `linear-gradient(to br, ${theme.accentColor}30, ${theme.accentColor}10)` }} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            {copy.badgeText && (
              <AnimatedSection delay={0}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8" style={{ backgroundColor: `${theme.primaryColor}08`, border: `1px solid ${theme.primaryColor}20`, color: theme.primaryColor }}>
                  <Zap className="w-4 h-4" />
                  {copy.badgeText}
                </div>
              </AnimatedSection>
            )}

            <AnimatedSection delay={100}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6">
                {copy.heroHeadline}{" "}
                {copy.heroHeadlineAccent && (
                  <span style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {copy.heroHeadlineAccent}
                  </span>
                )}
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                {copy.heroSubheadline}
              </p>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button className="rounded-full px-8 py-6 h-auto text-base" style={{ backgroundColor: theme.primaryColor }}>
                  {copy.primaryCtaText || "Get Started"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                {copy.secondaryCtaText && (
                  <Button variant="ghost" className="text-slate-600 hover:text-primary rounded-full px-8 py-6 h-auto text-base">
                    {copy.secondaryCtaText}
                  </Button>
                )}
              </div>
            </AnimatedSection>

            {/* Trust indicators */}
            {sectionsEnabled.trustBadges && (
              <AnimatedSection delay={400}>
                <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-16 pt-8 border-t border-slate-200/60">
                  {trustItems.map((item, index) => {
                    const icons = [Globe, Zap, Shield];
                    const Icon = icons[index % icons.length];
                    return (
                      <div key={index} className="flex items-center gap-2 text-slate-500">
                        <Icon className="w-5 h-5" style={{ color: theme.primaryColor }} />
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    );
                  })}
                </div>
              </AnimatedSection>
            )}
          </div>
        </section>
      )}

      {/* Services Section */}
      {sectionsEnabled.services && (
        <section className="py-24 bg-white relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background: `radial-gradient(ellipse 70% 50% at 80% 100%, ${theme.primaryColor}08, transparent 50%)`,
            }}
          />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <AnimatedSection className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: `${theme.primaryColor}08`, color: theme.primaryColor }}>
                Our Services
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
                Everything you need to{" "}
                <span style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  connect
                </span>
              </h2>
              <p className="text-slate-500 text-lg mt-4 max-w-2xl mx-auto">
                {copy.featuresSectionSubtitle || "Comprehensive communication solutions designed for modern businesses"}
              </p>
            </AnimatedSection>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {services.map((service, index) => {
                const IconComponent = iconMap[service.icon || 'check'] || CheckCircle2;
                const isMedium = service.size === 'medium';
                return (
                  <AnimatedSection
                    key={index}
                    delay={index * 100}
                    className={isMedium ? 'md:col-span-2' : ''}
                  >
                    <div className="group relative bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-500 ease-out h-full" style={{ boxShadow: `0 4px 24px -4px ${theme.primaryColor}08` }}>
                      <div className="relative z-10 p-8">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-3 rounded-xl" style={{ backgroundColor: `${theme.primaryColor}10` }}>
                            <IconComponent className="w-6 h-6" style={{ color: theme.primaryColor }} />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-slate-900 tracking-tight">{service.title}</h3>
                            {service.subtitle && <p className="text-sm text-slate-400 font-medium">{service.subtitle}</p>}
                          </div>
                        </div>
                        <p className="text-slate-500 leading-relaxed">{service.description}</p>
                      </div>
                      {/* Decorative gradient on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `linear-gradient(to br, ${theme.primaryColor}05, transparent)` }} />
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      {sectionsEnabled.stats && (
        <section className="py-20 relative" style={{ backgroundColor: theme.primaryColor }}>
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <AnimatedSection key={index} delay={index * 100} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-white/70 font-medium">{stat.label}</div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {sectionsEnabled.testimonials && (
        <section className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8">
            <AnimatedSection className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: `${theme.primaryColor}08`, color: theme.primaryColor }}>
                Testimonials
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
                {copy.testimonialsSectionTitle || "Trusted by industry leaders"}
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm h-full flex flex-col">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" style={{ color: theme.primaryColor }} />
                      ))}
                    </div>
                    <p className="text-slate-600 leading-relaxed flex-grow mb-6">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: theme.primaryColor }}>
                        {testimonial.author.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{testimonial.author}</div>
                        <div className="text-sm text-slate-500">{testimonial.role}{testimonial.company && `, ${testimonial.company}`}</div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {sectionsEnabled.contact && (
        <section className="py-24 bg-white relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <AnimatedSection className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: `${theme.primaryColor}08`, color: theme.primaryColor }}>
                  Contact Us
                </span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
                  {copy.contactSectionTitle || "Let's work together"}
                </h2>
                <p className="text-slate-500 text-lg mt-4 max-w-2xl mx-auto">
                  {copy.contactSectionSubtitle || "Get in touch with our team to discuss your communication needs"}
                </p>
              </AnimatedSection>

              <AnimatedSection delay={100}>
                <div className="bg-slate-50 rounded-3xl p-8 md:p-12">
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="john@company.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Company Inc." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                      <input type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                      <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="Tell us about your project..." />
                    </div>
                    <div className="md:col-span-2">
                      <Button className="w-full md:w-auto rounded-full px-8 py-6 h-auto text-base" style={{ backgroundColor: theme.primaryColor }}>
                        Send Message
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </form>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      {sectionsEnabled.footer && (
        <footer className="bg-slate-900 text-white py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ backgroundColor: theme.primaryColor }}>
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-xl">{copy.brandName || "PDS"}</span>
                </div>
                <p className="text-slate-400 max-w-sm leading-relaxed mb-6">
                  {copy.footerTagline || copy.heroSubheadline}
                </p>
                <div className="flex gap-4">
                  <a href="#" className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                    <Github className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-6">Services</h4>
                <ul className="space-y-4 text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">SMS Messaging</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Email Systems</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Direct Mail</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Global Network</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-6">Contact</h4>
                <ul className="space-y-4 text-slate-400">
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    hello@example.com
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    +1 (555) 000-0000
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    San Francisco, CA
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
              <p>{copy.copyright || copy.footerDisclaimer || `© ${new Date().getFullYear()} ${copy.brandName || "PDS"}. All rights reserved.`}</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
