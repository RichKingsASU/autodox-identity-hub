import { Skeleton } from "@/components/ui/skeleton";

export function DomainCardSkeleton() {
  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function DomainListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <DomainCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DNSRecordsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <div className="p-3 bg-muted rounded-md space-y-2">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="p-3 bg-muted rounded-md space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export function StatusBadgeSkeleton() {
  return <Skeleton className="h-5 w-20 rounded-full" />;
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
