import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfileTable } from "@/components/admin/UserProfileTable";
import { useProfiles, type ProfileWithRoles } from "@/hooks/useProfiles";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function AdminUsers() {
  const { data: profiles = [], isLoading } = useProfiles();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    userId: string;
    newRole: AppRole;
    userName: string;
  } | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithRoles | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    const profile = profiles.find((p) => p.user_id === userId);
    if (profile) {
      setRoleChangeTarget({
        userId,
        newRole,
        userName: `${profile.first_name} ${profile.last_name}`,
      });
    }
  };

  const confirmRoleChange = async () => {
    if (!roleChangeTarget) return;

    setIsUpdating(true);
    try {
      if (roleChangeTarget.newRole === "admin") {
        // Add admin role
        const { error } = await supabase.from("user_roles").insert({
          user_id: roleChangeTarget.userId,
          role: "admin",
        });
        if (error) throw error;
      } else {
        // Remove admin role (demote to user)
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", roleChangeTarget.userId)
          .eq("role", "admin");
        if (error) throw error;
      }

      toast({
        title: "Role updated",
        description: `${roleChangeTarget.userName}'s role has been updated.`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setRoleChangeTarget(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all registered users and their roles.
          </p>
        </div>
        <Button className="gap-2" disabled>
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Table */}
      <UserProfileTable
        profiles={profiles}
        loading={isLoading}
        onRoleChange={handleRoleChange}
        onViewDetails={setSelectedProfile}
      />

      {/* Role Change Confirmation Dialog */}
      <AlertDialog
        open={!!roleChangeTarget}
        onOpenChange={() => setRoleChangeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              {roleChangeTarget?.newRole === "admin"
                ? `Are you sure you want to promote ${roleChangeTarget?.userName} to Admin? They will gain access to the admin console.`
                : `Are you sure you want to remove admin privileges from ${roleChangeTarget?.userName}? They will lose access to the admin console.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Viewing profile information for {selectedProfile?.first_name} {selectedProfile?.last_name}
            </DialogDescription>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">First Name</label>
                  <p className="font-medium">{selectedProfile.first_name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Last Name</label>
                  <p className="font-medium">{selectedProfile.last_name}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium">{selectedProfile.email}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Phone</label>
                <p className="font-medium">{selectedProfile.phone || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Roles</label>
                <p className="font-medium capitalize">{selectedProfile.roles.join(", ")}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Joined</label>
                  <p className="font-medium">
                    {format(new Date(selectedProfile.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Last Updated</label>
                  <p className="font-medium">
                    {format(new Date(selectedProfile.updated_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
