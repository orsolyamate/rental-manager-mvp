import { useState } from "react";
import { Plus } from "lucide-react";

import { NewFeeForm } from "@/components/new-fee-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FEE_LABELS,
  formatDate,
  formatHuf,
  getEffectiveEntry,
  getUpcomingEntries,
  type FeeEntry,
  type FeeKind,
} from "@/lib/fees";
import type { FeesData } from "@/lib/fees.functions";

const NEW_LABELS: Record<FeeKind, string> = {
  rent: "Új lakbér rögzítése",
  common_cost: "Új közös költség rögzítése",
};

export function CurrentFeesCard({
  fees,
  monthFirstDay,
}: {
  fees: FeesData;
  monthFirstDay: string;
}) {
  const [openKind, setOpenKind] = useState<FeeKind | null>(null);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg">Aktuális díjak</CardTitle>
        <p className="text-sm text-muted-foreground">
          Egy hónapra mindig a hónap 1. napján érvényes összeg számít.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {(["rent", "common_cost"] as const).map((kind) => (
          <FeeRow
            key={kind}
            kind={kind}
            entries={fees[kind]}
            monthFirstDay={monthFirstDay}
            open={openKind === kind}
            onOpen={() => setOpenKind(kind)}
            onClose={() => setOpenKind(null)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function FeeRow({
  kind,
  entries,
  monthFirstDay,
  open,
  onOpen,
  onClose,
}: {
  kind: FeeKind;
  entries: FeeEntry[];
  monthFirstDay: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const current = getEffectiveEntry(entries, monthFirstDay);
  const upcoming = getUpcomingEntries(entries, monthFirstDay);

  return (
    <section aria-label={FEE_LABELS[kind]} className="rounded-lg bg-secondary/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {FEE_LABELS[kind]}
          </h2>
          {current ? (
            <>
              <p
                className="mt-1 text-2xl font-semibold tabular-nums text-foreground"
                data-testid={`current-${kind}`}
              >
                {formatHuf(current.amount)}
              </p>
              <p className="text-sm text-muted-foreground">
                Érvényes ettől: {formatDate(current.valid_from)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Ebben a hónapban még nincs érvényes összeg.
            </p>
          )}
          {upcoming.map((u) => (
            <p key={u.id} className="mt-1 text-sm text-foreground">
              <span className="font-medium">Jövőbeli:</span> {formatHuf(u.amount)}, ettől:{" "}
              {formatDate(u.valid_from)}
            </p>
          ))}
        </div>
        {!open ? (
          <Button variant="outline" className="w-full sm:w-auto" onClick={onOpen}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {NEW_LABELS[kind]}
          </Button>
        ) : null}
      </div>
      {open ? <NewFeeForm kind={kind} onDone={onClose} /> : null}
    </section>
  );
}
