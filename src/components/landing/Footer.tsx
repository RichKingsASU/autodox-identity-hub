import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        {/* Trusted By */}
        <div className="text-center mb-12">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            Trusted by Modern Engineering Teams
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
            {["LUMINA", "VOXON", "NEXA", "QUBIT", "ORION"].map((company) => (
              <span
                key={company}
                className="text-lg font-bold text-muted-foreground/50 tracking-wider"
              >
                {company}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">AUTODOX</span>
            <span className="text-muted-foreground text-sm ml-4">
              © 2026 Autodox Systems Inc.
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
