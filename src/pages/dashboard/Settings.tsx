import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    phone: profile?.phone || "",
    companyName: (profile as any)?.company_name || "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      });
      toast({
        title: "Settings saved",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: "Please try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Profile Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  First Name
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input-recessed"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input-recessed"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email
                </label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="input-recessed opacity-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-recessed"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Company Name
                </label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="input-recessed"
                />
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-gradient text-primary-foreground"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Password
                </label>
                <Input type="password" className="input-recessed" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  New Password
                </label>
                <Input type="password" className="input-recessed" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Confirm New Password
                </label>
                <Input type="password" className="input-recessed" />
              </div>
              <Button variant="outline">Update Password</Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add an extra layer of security to your account.
                </p>
              </div>
              <Switch />
            </div>
          </GlassCard>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Email Notifications</h3>
            <div className="space-y-4">
              {[
                { label: "Verification completed", description: "Get notified when a verification is processed" },
                { label: "Weekly reports", description: "Receive weekly summary of your account activity" },
                { label: "Product updates", description: "Stay informed about new features and improvements" },
                { label: "Security alerts", description: "Get notified about security-related events" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">SMS Notifications</h3>
            <div className="space-y-4">
              {[
                { label: "Critical alerts", description: "Receive SMS for urgent account issues" },
                { label: "Usage alerts", description: "Get notified when approaching usage limits" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch />
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Webhook Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Webhook URL
                </label>
                <Input
                  placeholder="https://your-app.com/webhooks/autodox"
                  className="input-recessed"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Webhook Secret
                </label>
                <Input
                  type="password"
                  placeholder="whsec_..."
                  className="input-recessed"
                />
              </div>
              <Button variant="outline">Save Webhook Settings</Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">API Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">Enable sandbox mode</p>
                  <p className="text-sm text-muted-foreground">
                    Route all API calls through the test environment
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">Log all requests</p>
                  <p className="text-sm text-muted-foreground">
                    Keep detailed logs of all API requests
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <GlassCard className="p-6 border-destructive/50">
        <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </GlassCard>
    </motion.div>
  );
}
