import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatHuf } from "@/lib/common";
import type { Invoice } from "@/lib/invoices";

function Name({ name }: { name: string | null }) {
  return name ? <>{name}</> : <span className="italic text-muted-foreground">Nincs megadva</span>;
}

function Status({ paid }: { paid: boolean }) {
  return paid ? <Badge>Fizetve</Badge> : <Badge variant="outline">Fizetendő</Badge>;
}

export function SettlementInvoicesCard({
  invoices,
  total,
}: {
  invoices: Invoice[];
  total: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg">A hónap számlái ({invoices.length})</CardTitle>
        <p className="text-sm text-muted-foreground">
          A számla dátuma alapján, fizetési státusztól függetlenül.
        </p>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ebben a hónapban nincs rögzített számla.</p>
        ) : (
          <>
            <table className="hidden w-full text-sm md:table" aria-label="A hónap számlái">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Számla dátuma</th>
                  <th className="py-2 pr-3 font-medium">Szolgáltató / megnevezés</th>
                  <th className="py-2 pr-3 font-medium">Státusz</th>
                  <th className="py-2 text-right font-medium">Összeg</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b">
                    <td className="py-3 pr-3 tabular-nums">{formatDate(inv.invoice_date)}</td>
                    <td className="break-words py-3 pr-3">
                      <Name name={inv.provider_name} />
                    </td>
                    <td className="py-3 pr-3">
                      <Status paid={inv.paid} />
                    </td>
                    <td className="whitespace-nowrap py-3 text-right font-medium tabular-nums">
                      {formatHuf(inv.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 font-semibold">
                    Számlák összesen
                  </td>
                  <td className="whitespace-nowrap pt-3 text-right font-semibold tabular-nums">
                    {formatHuf(total)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="md:hidden">
              <ul className="space-y-3" aria-label="A hónap számlái">
                {invoices.map((inv) => (
                  <li key={inv.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 break-words font-medium">
                        <Name name={inv.provider_name} />
                      </p>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {formatHuf(inv.amount)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="tabular-nums text-muted-foreground">
                        {formatDate(inv.invoice_date)}
                      </span>
                      <Status paid={inv.paid} />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between gap-3 border-t pt-3 text-sm font-semibold">
                <span>Számlák összesen</span>
                <span className="tabular-nums">{formatHuf(total)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
