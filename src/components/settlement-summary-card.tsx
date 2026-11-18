import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatHuf } from "@/lib/common";
import type { FeeEntry } from "@/lib/fees";
import { formatMonthLabel, type Settlement } from "@/lib/settlement";

function FeeLine({ label, entry }: { label: string; entry: FeeEntry | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <dt className="font-medium">{label}</dt>
        <p className="text-xs text-muted-foreground">
          {entry
            ? `Érvényes ettől: ${formatDate(entry.valid_from)}`
            : "Nincs érvényes érték erre a hónapra"}
        </p>
      </div>
      <dd className="shrink-0 text-right font-medium tabular-nums">
        {entry ? formatHuf(entry.amount) : <span className="text-destructive">Hiányzik</span>}
      </dd>
    </div>
  );
}

export function SettlementSummaryCard({ settlement: s }: { settlement: Settlement }) {
  const missingNames = s.missing.map((m) => (m === "rent" ? "lakbér" : "közös költség"));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg">
          Összesítő – {formatMonthLabel(s.month)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y text-sm">
          <FeeLine label="Lakbér" entry={s.rent} />
          <FeeLine label="Közös költség" entry={s.commonCost} />
          <div className="flex items-start justify-between gap-4 py-3">
            <div>
              <dt className="font-medium">Számlák</dt>
              <p className="text-xs text-muted-foreground">
                {s.invoices.length} db számla ebben a hónapban
              </p>
            </div>
            <dd className="shrink-0 text-right font-medium tabular-nums">
              {formatHuf(s.invoicesTotal)}
            </dd>
          </div>
        </dl>

        <div className="mt-2 rounded-lg bg-secondary/60 p-4">
          {s.total !== null ? (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-base font-semibold sm:text-lg">
                  Havi végösszeg
                </span>
                <span
                  className="font-display text-xl font-semibold tabular-nums sm:text-2xl"
                  data-testid="settlement-total"
                >
                  {formatHuf(s.total)}
                </span>
              </div>
              <p className="mt-1 break-words text-xs text-muted-foreground tabular-nums">
                {formatHuf(s.rent!.amount)} + {formatHuf(s.commonCost!.amount)} +{" "}
                {formatHuf(s.invoicesTotal)}
              </p>
            </>
          ) : (
            <div role="alert" className="flex gap-3 text-sm">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p>
                <span className="font-semibold">A havi végösszeg nem számítható.</span> Ehhez a
                hónaphoz nincs érvényes {missingNames.join(" és ")}. Rögzítsd az Áttekintés oldalon
                a megfelelő érvényességi dátummal.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
