import { RestrictedFeature } from "@/components/dashboard/RestrictedFeature";
import { GlassCard } from "@/components/ui/GlassCard";
import { CreditCard, Receipt, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Billing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods.
        </p>
      </div>

      <RestrictedFeature featureName="Billing">
        <div className="space-y-6">
          {/* Current Plan */}
          <GlassCard className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Pro Plan</h3>
                <p className="text-muted-foreground">$99/month • Renews on Feb 1, 2024</p>
              </div>
              <Button variant="outline">Change Plan</Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">API Calls Used</span>
                  <span className="text-foreground">7,500 / 10,000</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">SMS Verifications</span>
                  <span className="text-foreground">4,200 / 5,000</span>
                </div>
                <Progress value={84} className="h-2" />
              </div>
            </div>
          </GlassCard>

          {/* Payment Method */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Payment Method</h3>
              <Button variant="outline" size="sm">Update</Button>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
          </GlassCard>

          {/* Quick Stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-lg font-semibold text-foreground">$99.00</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Savings</p>
                  <p className="text-lg font-semibold text-foreground">$24.00</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Invoice</p>
                  <p className="text-lg font-semibold text-foreground">Feb 1</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </RestrictedFeature>
    </div>
  );
}
