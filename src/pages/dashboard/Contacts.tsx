import { RestrictedFeature } from "@/components/dashboard/RestrictedFeature";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill } from "@/components/ui/StatusPill";

const mockContacts = [
  { id: 1, name: "John Smith", phone: "+1 (555) 123-4567", status: "verified", lastVerified: "2024-01-15" },
  { id: 2, name: "Sarah Johnson", phone: "+1 (555) 234-5678", status: "pending", lastVerified: "2024-01-14" },
  { id: 3, name: "Michael Brown", phone: "+1 (555) 345-6789", status: "verified", lastVerified: "2024-01-13" },
  { id: 4, name: "Emily Davis", phone: "+1 (555) 456-7890", status: "failed", lastVerified: "2024-01-12" },
  { id: 5, name: "David Wilson", phone: "+1 (555) 567-8901", status: "verified", lastVerified: "2024-01-11" },
];

export default function Contacts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
        <p className="text-muted-foreground">
          Manage your customer database and verification history.
        </p>
      </div>

      <RestrictedFeature featureName="Contacts">
        <GlassCard className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell className="font-mono text-sm">{contact.phone}</TableCell>
                  <TableCell>
                    <StatusPill status={contact.status as "verified" | "pending" | "failed"} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contact.lastVerified}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </GlassCard>
      </RestrictedFeature>
    </div>
  );
}
