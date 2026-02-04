import { LandingBaseLayout, LayoutProps } from "@/types/templates";
import { HeroFocusedLayout } from "./HeroFocusedLayout";
import { ComplianceHeavyLayout } from "./ComplianceHeavyLayout";
import { TrustSignalDenseLayout } from "./TrustSignalDenseLayout";
import { MinimalEnterpriseLayout } from "./MinimalEnterpriseLayout";
import { SDKFocusedLayout } from "./SDKFocusedLayout";
import { GlobalReachLayout } from "./GlobalReachLayout";
import { SecurityFirstLayout } from "./SecurityFirstLayout";
import { ConversionOptimizedLayout } from "./ConversionOptimizedLayout";
import { KoalaSignLayout } from "./KoalaSignLayout";
import { RedlineDeliveryLayout } from "./RedlineDeliveryLayout";
import { AlertTriangle } from "lucide-react";

interface LayoutRendererProps extends LayoutProps {
  baseLayout: LandingBaseLayout;
}

const layoutComponents: Record<LandingBaseLayout, React.ComponentType<LayoutProps>> = {
  hero_focused: HeroFocusedLayout,
  compliance_heavy: ComplianceHeavyLayout,
  trust_signal_dense: TrustSignalDenseLayout,
  minimal_enterprise: MinimalEnterpriseLayout,
  sdk_focused: SDKFocusedLayout,
  global_reach: GlobalReachLayout,
  security_first: SecurityFirstLayout,
  conversion_optimized: ConversionOptimizedLayout,
  koala_sign: KoalaSignLayout,
  redline_delivery: RedlineDeliveryLayout,
};

export function LayoutRenderer({ baseLayout, copy, theme, sectionsEnabled, previewMode }: LayoutRendererProps) {
  const LayoutComponent = layoutComponents[baseLayout];

  // Safe fallback for unknown layout types
  if (!LayoutComponent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 mx-auto text-amber-500" />
          <h1 className="text-2xl font-bold">Unknown Layout</h1>
          <p className="text-muted-foreground">
            The layout type "{baseLayout}" is not recognized.
          </p>
        </div>
      </div>
    );
  }

  return (
    <LayoutComponent
      copy={copy}
      theme={theme}
      sectionsEnabled={sectionsEnabled}
      previewMode={previewMode}
    />
  );
}

// Export layout names for display purposes
export const layoutDisplayNames: Record<LandingBaseLayout, string> = {
  hero_focused: 'Hero Focused',
  compliance_heavy: 'Compliance Heavy',
  trust_signal_dense: 'Trust Signal Dense',
  minimal_enterprise: 'Minimal Enterprise',
  sdk_focused: 'SDK Focused',
  global_reach: 'Global Reach',
  security_first: 'Security First',
  conversion_optimized: 'Conversion Optimized',
  koala_sign: 'Koala Sign (Document Security)',
  redline_delivery: 'Redline Delivery (Corporate)',
};
