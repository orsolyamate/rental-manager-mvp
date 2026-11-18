import { useState } from "react";
import { Pencil } from "lucide-react";

import { InvoicePaymentDialog } from "@/components/invoice-payment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatHuf } from "@/lib/common";
import type { Invoice } from "@/lib/invoices";

function StatusBadge({ paid }: { paid: boolean }) {
  return paid ? <Badge>Fizetve</Badge> : <Badge variant="outline">Fizetendő</Badge>;
}

function Provider({ name }: { name: string | null }) {
  return name ? <>{name}</> : <span className="italic text-muted-foreground">Nincs megadva</span>;
}

const dash = <span className="text-muted-foreground">–</span>;

function editLabel(inv: Invoice) {
  return `Fizetési státusz módosítása: ${inv.provider_name ?? "megnevezés nélküli számla"}, ${formatDate(inv.invoice_date)}`;
}

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [editing, setEditing] = useState<Invoice | null>(null);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg">Számlák ({invoices.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Még nincs rögzített számla.</p>
        ) : (
          <>
            {/* Tablet / desktop: table */}
            <table className="hidden w-full text-sm md:table" aria-label="Számlák listája">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Számla dátuma</th>
                  <th className="py-2 pr-3 font-medium">Szolgáltató / megnevezés</th>
                  <th className="py-2 pr-3 text-right font-medium">Összeg</th>
                  <th className="py-2 pr-3 font-medium">Fizetési határidő</th>
                  <th className="py-2 pr-3 font-medium">Státusz</th>
                  <th className="py-2 pr-3 font-medium">Fizetés dátuma</th>
                  <th className="py-2 font-medium">
                    <span className="sr-only">Műveletek</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-3 pr-3 tabular-nums">{formatDate(inv.invoice_date)}</td>
                    <td className="break-words py-3 pr-3">
                      <Provider name={inv.provider_name} />
                    </td>
                    <td className="whitespace-nowrap py-3 pr-3 text-right font-medium tabular-nums">
                      {formatHuf(inv.amount)}
                    </td>
                    <td className="py-3 pr-3 tabular-nums">
                      {inv.due_date ? formatDate(inv.due_date) : dash}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge paid={inv.paid} />
                    </td>
                    <td className="py-3 pr-3 tabular-nums">
                      {inv.paid_date ? formatDate(inv.paid_date) : dash}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(inv)}
                        aria-label={editLabel(inv)}
                        title="Fizetési státusz módosítása"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden lg:inline">Módosítás</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile: cards */}
            <ul className="space-y-3 md:hidden" aria-label="Számlák listája">
              {invoices.map((inv) => (
                <li key={inv.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words font-medium">
                      <Provider name={inv.provider_name} />
                    </p>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatHuf(inv.amount)}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Számla dátuma</dt>
                      <dd className="tabular-nums">{formatDate(inv.invoice_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Határidő</dt>
                      <dd className="tabular-nums">
                        {inv.due_date ? formatDate(inv.due_date) : dash}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Státusz</dt>
                      <dd className="mt-0.5">
                        <StatusBadge paid={inv.paid} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Fizetés dátuma</dt>
                      <dd className="tabular-nums">
                        {inv.paid_date ? formatDate(inv.paid_date) : dash}
                      </dd>
                    </div>
                  </dl>
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => setEditing(inv)}
                    aria-label={editLabel(inv)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Fizetési státusz módosítása
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
      <InvoicePaymentDialog invoice={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </Card>
  );
}
