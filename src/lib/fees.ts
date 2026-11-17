import { z } from "zod";

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

const hufFormatter = new Intl.NumberFormat("hu-HU", {
  style: "currency",
  currency: "HUF",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatHuf(amount: number): string {
  return hufFormatter.format(amount);
}

/** "2026-07-01" -> "2026.07.01." */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${y}.${m}.${d}.`;
}

/** Parses user input like "220 000" or "1500,5" into a number (NaN if not a number). */
export function parseAmountInput(raw: string): number {
  const cleaned = raw.replace(/[\s\u00a0]/g, "").replace(",", ".");
  if (cleaned === "" || !/^-?\d+(\.\d+)?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export const newFeeSchema = z.object({
  kind: z.enum(["rent", "common_cost"]),
  amount: z
    .number({
      invalid_type_error: "Az összeg csak szám lehet.",
      required_error: "Add meg az összeget.",
    })
    .refine((n) => Number.isFinite(n), "Az összeg csak szám lehet.")
    .refine((n) => n > 0, "Az összegnek nullánál nagyobbnak kell lennie.")
    .refine((n) => n < 10_000_000_000, "Az összeg túl nagy.")
    .refine((n) => Math.round(n * 100) === n * 100, "Legfeljebb két tizedesjegy adható meg."),
  validFrom: z
    .string({ required_error: "Add meg a hatálybalépés dátumát." })
    .min(1, "Add meg a hatálybalépés dátumát.")
    .refine(isRealDate, "Érvénytelen dátum."),
});

export type NewFeeInput = z.infer<typeof newFeeSchema>;
