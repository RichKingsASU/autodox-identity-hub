import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Building2,
  FileText,
  ExternalLink,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useApplications, ApplicationWithProfile } from "@/hooks/useApplications";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminApplications() {
  const { applications, loading, stats, updateApplicationStatus } = useApplications();
  const [selectedApp, setSelectedApp] = useState<ApplicationWithProfile | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    action: "approved" | "rejected";
    companyName: string;
  } | null>(null);

  const handleStatusUpdate = async () => {
    if (!confirmAction) return;
    await updateApplicationStatus(confirmAction.id, confirmAction.action);
    setConfirmAction(null);
  };

  const statCards = [
    {
      label: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Application Review</h1>
          <p className="text-muted-foreground">
            Review and approve business verification applications
          </p>
        </div>
        {stats.pending > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            {stats.pending} pending
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-12" /> : stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Applications Table */}
      <GlassCard className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>EIN</TableHead>
              <TableHead>Monthly Volume</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No applications yet</p>
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {app.company_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {app.profiles ? (
                      <div>
                        <p className="font-medium">
                          {app.profiles.first_name} {app.profiles.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {app.profiles.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{app.ein}</TableCell>
                  <TableCell>{app.monthly_volume}</TableCell>
                  <TableCell>
                    <StatusPill status={app.status}>{app.status}</StatusPill>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(app.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedApp(app)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {app.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() =>
                              setConfirmAction({
                                id: app.id,
                                action: "approved",
                                companyName: app.company_name,
                              })
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() =>
                              setConfirmAction({
                                id: app.id,
                                action: "rejected",
                                companyName: app.company_name,
                              })
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </GlassCard>

      {/* Application Details Modal */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedApp?.company_name}
            </DialogTitle>
            <DialogDescription>
              Application submitted{" "}
              {selectedApp &&
                format(new Date(selectedApp.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusPill status={selectedApp.status}>
                  {selectedApp.status}
                </StatusPill>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Applicant
                  </label>
                  <p className="font-medium">
                    {selectedApp.profiles
                      ? `${selectedApp.profiles.first_name} ${selectedApp.profiles.last_name}`
                      : "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.profiles?.email || "—"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      EIN
                    </label>
                    <p className="font-mono">{selectedApp.ein}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Monthly Volume
                    </label>
                    <p>{selectedApp.monthly_volume}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Use Case
                  </label>
                  <p className="text-sm">{selectedApp.use_case}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <a
                    href={selectedApp.tos_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Terms of Service
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={selectedApp.privacy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Privacy Policy
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {selectedApp.status === "pending" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setConfirmAction({
                        id: selectedApp.id,
                        action: "approved",
                        companyName: selectedApp.company_name,
                      });
                      setSelectedApp(null);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => {
                      setConfirmAction({
                        id: selectedApp.id,
                        action: "rejected",
                        companyName: selectedApp.company_name,
                      });
                      setSelectedApp(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "approved" ? "Approve" : "Reject"} Application?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "approved" ? (
                <>
                  This will approve <strong>{confirmAction.companyName}</strong>'s
                  application and grant them full access to the platform. An email
                  notification will be sent.
                </>
              ) : (
                <>
                  This will reject <strong>{confirmAction?.companyName}</strong>'s
                  application. They will be notified via email and can reapply.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdate}
              className={
                confirmAction?.action === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }
            >
              {confirmAction?.action === "approved" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
