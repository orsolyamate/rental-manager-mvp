import { z } from "zod";
import { amountSchema, requiredDateSchema } from "./common";

export { formatDate, formatHuf, parseAmountInput } from "./common";

export type FeeKind = "rent" | "common_cost";

export const FEE_LABELS: Record<FeeKind, string> = {
  rent: "Lakbér",
  common_cost: "Közös költség",
};

export type FeeEntry = { id: string; amount: number; valid_from: string };

/** First day of a month as an ISO date string, e.g. monthStart(2026, 10) -> "2026-10-01". */
export function monthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/** First day of the current month in Hungarian time (Europe/Budapest). */
export function currentMonthStart(now: Date = new Date()): string {
  const ym = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
  }).format(now); // "2026-11"
  return `${ym}-01`;
}

/**
 * Business rule: for a month, use the latest entry whose valid_from is on or before
 * the first day of that month. Returns null if no entry is valid yet.
 */
export function getEffectiveEntry(entries: FeeEntry[], monthFirstDay: string): FeeEntry | null {
  let best: FeeEntry | null = null;
  for (const e of entries) {
    if (e.valid_from <= monthFirstDay && (!best || e.valid_from > best.valid_from)) best = e;
  }
  return best;
}

/** Entries that are not yet effective for the given month (valid_from after its first day). */
export function getUpcomingEntries(entries: FeeEntry[], monthFirstDay: string): FeeEntry[] {
  return entries
    .filter((e) => e.valid_from > monthFirstDay)
    .sort((a, b) => a.valid_from.localeCompare(b.valid_from));
}

export const newFeeSchema = z.object({
  kind: z.enum(["rent", "common_cost"]),
  amount: amountSchema,
  validFrom: requiredDateSchema("Add meg a hatálybalépés dátumát."),
});

export type NewFeeInput = z.infer<typeof newFeeSchema>;
