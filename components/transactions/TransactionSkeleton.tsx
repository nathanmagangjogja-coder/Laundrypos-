import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function TransactionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH className="w-10"><Skeleton className="h-4 w-4" /></TH>
              <TH><Skeleton className="h-4 w-24" /></TH>
              <TH><Skeleton className="h-4 w-32" /></TH>
              <TH className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TH>
              <TH><Skeleton className="h-4 w-16" /></TH>
              <TH><Skeleton className="h-4 w-16" /></TH>
              <TH><Skeleton className="h-4 w-16" /></TH>
              <TH className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TR key={i}>
                <TD><Skeleton className="h-4 w-4" /></TD>
                <TD><Skeleton className="h-4 w-20" /></TD>
                <TD>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </TD>
                <TD className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TD>
                <TD><Skeleton className="h-4 w-16" /></TD>
                <TD><Skeleton className="h-6 w-16 rounded-full" /></TD>
                <TD><Skeleton className="h-6 w-16 rounded-full" /></TD>
                <TD className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TD>
                <TD><Skeleton className="h-4 w-12" /></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
