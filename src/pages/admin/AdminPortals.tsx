import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Palette,
  Search,
  Settings,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/GlassCard";
import { PortalConfigEditor } from "@/components/admin/PortalConfigEditor";
import {
  useAllPortalConfigs,
  useAllProfiles,
  PortalConfigWithUser,
} from "@/hooks/usePortalConfig";
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

interface UserWithConfig {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  config: PortalConfigWithUser | null;
}

export default function AdminPortals() {
  const { configs, loading: configsLoading, createConfig, updateConfig, deleteConfig } = useAllPortalConfigs();
  const { profiles, loading: profilesLoading } = useAllProfiles();
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);

  // Merge profiles with their configs
  const usersWithConfigs = useMemo(() => {
    const configMap = new Map(configs.map((c) => [c.user_id, c]));
    return profiles.map((profile) => ({
      user_id: profile.user_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      config: configMap.get(profile.user_id) || null,
    }));
  }, [profiles, configs]);

  // Filter by search
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return usersWithConfigs;
    const query = search.toLowerCase();
    return usersWithConfigs.filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        u.first_name.toLowerCase().includes(query) ||
        u.last_name.toLowerCase().includes(query) ||
        u.config?.brand_name?.toLowerCase().includes(query)
    );
  }, [usersWithConfigs, search]);

  const loading = configsLoading || profilesLoading;

  const handleEditPortal = (user: UserWithConfig) => {
    setSelectedUser(user);
    setEditorOpen(true);
  };

  const handleSaveConfig = async (configData: {
    brand_name: string;
    primary_color: string;
    secondary_color: string;
    logo_url: string | null;
  }) => {
    if (!selectedUser) return;

    if (selectedUser.config) {
      await updateConfig(selectedUser.config.id, configData);
    } else {
      await createConfig(selectedUser.user_id, configData);
    }
  };

  const handleDeleteConfig = async () => {
    if (configToDelete) {
      await deleteConfig(configToDelete);
      setConfigToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Portal Configurations
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage white-label portal settings for each user
          </p>
        </div>
        <Badge variant="outline" className="font-mono">
          {usersWithConfigs.filter((u) => u.config).length} / {usersWithConfigs.length} configured
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Brand Name</TableHead>
              <TableHead className="font-semibold">Colors</TableHead>
              <TableHead className="font-semibold">Logo</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.config ? (
                      <span className="font-medium">{user.config.brand_name}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.config ? (
                      <div className="flex items-center gap-1">
                        <div
                          className="h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: user.config.primary_color }}
                          title={user.config.primary_color}
                        />
                        <div
                          className="h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: user.config.secondary_color }}
                          title={user.config.secondary_color}
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.config?.logo_url ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    {user.config ? (
                      <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Not configured
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPortal(user)}>
                          <Settings className="h-4 w-4 mr-2" />
                          {user.config ? "Edit Portal" : "Configure Portal"}
                        </DropdownMenuItem>
                        {user.config && (
                          <>
                            <DropdownMenuItem
                              onClick={() => window.open(`/my-portal?preview=${user.user_id}`, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Preview Portal
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setConfigToDelete(user.config!.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Config
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </GlassCard>

      {/* Editor Dialog */}
      {selectedUser && (
        <PortalConfigEditor
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveConfig}
          existingConfig={selectedUser.config}
          userName={`${selectedUser.first_name} ${selectedUser.last_name}`}
          userEmail={selectedUser.email}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portal Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all customizations for this user's portal. They will see the default branding until reconfigured.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfig}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
