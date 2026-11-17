import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FEE_LABELS, formatDate, formatHuf, getEffectiveEntry, type FeeKind } from "@/lib/fees";
import type { FeesData } from "@/lib/fees.functions";

type Row = {
  id: string;
  kind: FeeKind;
  amount: number;
  valid_from: string;
  status: "current" | "future" | "past";
};

function buildRows(fees: FeesData, monthFirstDay: string): Row[] {
  const rows: Row[] = [];
  for (const kind of ["rent", "common_cost"] as const) {
    const current = getEffectiveEntry(fees[kind], monthFirstDay);
    for (const e of fees[kind]) {
      const status =
        e.id === current?.id ? "current" : e.valid_from > monthFirstDay ? "future" : "past";
      rows.push({ id: e.id, kind, amount: e.amount, valid_from: e.valid_from, status });
    }
  }
  return rows.sort(
    (a, b) => b.valid_from.localeCompare(a.valid_from) || a.kind.localeCompare(b.kind) * -1,
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  if (status === "current") return <Badge>Aktuális</Badge>;
  if (status === "future") return <Badge variant="outline">Jövőbeli</Badge>;
  return null;
}

export function FeeHistoryCard({ fees, monthFirstDay }: { fees: FeesData; monthFirstDay: string }) {
  const rows = buildRows(fees, monthFirstDay);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg">Díjak előzményei</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Még nincs rögzített díj.</p>
        ) : (
          <>
            {/* Desktop / tablet: table */}
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Dátum</th>
                  <th className="py-2 pr-4 font-medium">Típus</th>
                  <th className="py-2 pr-4 text-right font-medium">Összeg</th>
                  <th className="py-2 font-medium">
                    <span className="sr-only">Állapot</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 tabular-nums">{formatDate(r.valid_from)}</td>
                    <td className="py-3 pr-4">{FEE_LABELS[r.kind]}</td>
                    <td className="py-3 pr-4 text-right font-medium tabular-nums">
                      {formatHuf(r.amount)}
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile: list */}
            <ul className="space-y-2 sm:hidden">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{FEE_LABELS[r.kind]}</p>
                    <p className="text-sm tabular-nums text-muted-foreground">
                      {formatDate(r.valid_from)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-semibold tabular-nums">{formatHuf(r.amount)}</span>
                    <StatusBadge status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
