import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, UserCog, Crown, MoreHorizontal, UserPlus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoleManagement, type ProfileWithRoles } from "@/hooks/useRoleManagement";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function AdminAccess() {
  const { privilegedUsers, allProfiles, loading, stats, grantRole, revokeRole } = useRoleManagement();
  
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    user: ProfileWithRoles | null;
    role: AppRole | null;
  }>({ open: false, user: null, role: null });

  const [grantDialog, setGrantDialog] = useState<{
    open: boolean;
    selectedUserId: string;
    selectedRole: AppRole;
  }>({ open: false, selectedUserId: "", selectedRole: "admin" });

  const handleRevokeRole = async () => {
    if (revokeDialog.user && revokeDialog.role) {
      await revokeRole(revokeDialog.user.user_id, revokeDialog.role);
      setRevokeDialog({ open: false, user: null, role: null });
    }
  };

  const handleGrantRole = async () => {
    if (grantDialog.selectedUserId && grantDialog.selectedRole) {
      await grantRole(grantDialog.selectedUserId, grantDialog.selectedRole);
      setGrantDialog({ open: false, selectedUserId: "", selectedRole: "admin" });
    }
  };

  // Filter out users who already have elevated roles for the grant dialog
  const usersWithoutElevatedRoles = allProfiles.filter(
    (profile) => !privilegedUsers.some((pu) => pu.user_id === profile.user_id)
  );

  const getRoleBadgeStatus = (role: AppRole): "active" | "pending" | "unverified" => {
    switch (role) {
      case "super_admin":
        return "active";
      case "admin":
        return "pending";
      default:
        return "unverified";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 lg:p-8"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Access Control</h1>
        </div>
        <p className="text-muted-foreground">
          Manage administrator roles and permissions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Super Admins</p>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats.superAdminCount}</p>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <UserCog className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats.adminCount}</p>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Regular Users</p>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats.userCount}</p>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Privileged Users Table */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Privileged Users</h2>
          <Button
            onClick={() => setGrantDialog({ open: true, selectedUserId: "", selectedRole: "admin" })}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Grant Role
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : privilegedUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users with elevated roles found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {privilegedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.roles.map((role) => (
                        <StatusPill key={role} status={getRoleBadgeStatus(role)}>
                          {role.replace("_", " ")}
                        </StatusPill>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border border-border">
                        <DropdownMenuLabel>Manage Roles</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {!user.roles.includes("super_admin") && (
                          <DropdownMenuItem
                            onClick={() =>
                              setGrantDialog({
                                open: true,
                                selectedUserId: user.user_id,
                                selectedRole: "super_admin",
                              })
                            }
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Grant Super Admin
                          </DropdownMenuItem>
                        )}
                        {!user.roles.includes("admin") && (
                          <DropdownMenuItem
                            onClick={() =>
                              setGrantDialog({
                                open: true,
                                selectedUserId: user.user_id,
                                selectedRole: "admin",
                              })
                            }
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Grant Admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {user.roles.map((role) => (
                          <DropdownMenuItem
                            key={role}
                            className="text-destructive focus:text-destructive"
                            onClick={() => setRevokeDialog({ open: true, user, role })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke {role.replace("_", " ")}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>

      {/* Audit Log Placeholder */}
      <GlassCard className="mt-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Audit Log</h2>
        <div className="text-center py-8 text-muted-foreground">
          <p>Role change history will appear here.</p>
          <p className="text-sm mt-1">Coming soon in a future update.</p>
        </div>
      </GlassCard>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog
        open={revokeDialog.open}
        onOpenChange={(open) => !open && setRevokeDialog({ open: false, user: null, role: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the{" "}
              <strong>{revokeDialog.role?.replace("_", " ")}</strong> role from{" "}
              <strong>
                {revokeDialog.user?.first_name} {revokeDialog.user?.last_name}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Grant Role Dialog */}
      <Dialog
        open={grantDialog.open}
        onOpenChange={(open) =>
          !open && setGrantDialog({ open: false, selectedUserId: "", selectedRole: "admin" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Role</DialogTitle>
            <DialogDescription>
              Select a user and role to grant elevated permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select
                value={grantDialog.selectedUserId}
                onValueChange={(value) =>
                  setGrantDialog((prev) => ({ ...prev, selectedUserId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {usersWithoutElevatedRoles.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      {profile.first_name} {profile.last_name} ({profile.email})
                    </SelectItem>
                  ))}
                  {/* Also show privileged users for additional role grants */}
                  {privilegedUsers.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      {profile.first_name} {profile.last_name} ({profile.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={grantDialog.selectedRole}
                onValueChange={(value) =>
                  setGrantDialog((prev) => ({ ...prev, selectedRole: value as AppRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setGrantDialog({ open: false, selectedUserId: "", selectedRole: "admin" })
              }
            >
              Cancel
            </Button>
            <Button onClick={handleGrantRole} disabled={!grantDialog.selectedUserId}>
              Grant Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
