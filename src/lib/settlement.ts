import { currentMonthStart, getEffectiveEntry, type FeeEntry } from "./fees";
import type { Invoice } from "./invoices";

/** Month key in the form "YYYY-MM". */
export type MonthKey = string;

const HU_MONTHS = [
  "január",
  "február",
  "március",
  "április",
  "május",
  "június",
  "július",
  "augusztus",
  "szeptember",
  "október",
  "november",
  "december",
];

export function isMonthKey(value: unknown): value is MonthKey {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return false;
  const m = Number(value.slice(5, 7));
  return m >= 1 && m <= 12;
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return currentMonthStart(now).slice(0, 7);
}

/** "2026-11" -> "2026. november" */
export function formatMonthLabel(month: MonthKey): string {
  return `${month.slice(0, 4)}. ${HU_MONTHS[Number(month.slice(5, 7)) - 1]}`;
}

export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7)) - 1 + delta;
  const year = y + Math.floor(m / 12);
  const mon = ((m % 12) + 12) % 12;
  return `${year}-${String(mon + 1).padStart(2, "0")}`;
}

/**
 * Months offered in the picker: from the earliest month that has data up to 12 months after
 * the current month (newest first). The selected month is always included.
 */
export function monthOptions(
  dataDates: string[],
  current: MonthKey,
  selected: MonthKey,
): MonthKey[] {
  const months = dataDates.map((d) => d.slice(0, 7));
  let from = [current, selected, ...months].reduce((a, b) => (b < a ? b : a));
  let to = shiftMonth(current, 12);
  if (selected > to) to = selected;
  const out: MonthKey[] = [];
  for (let m = to; m >= from; m = shiftMonth(m, -1)) out.push(m);
  return out;
}

/** Exact money sum (avoids floating point drift by summing whole fillér). */
export function sumAmounts(amounts: number[]): number {
  return amounts.reduce((acc, a) => acc + Math.round(a * 100), 0) / 100;
}

export type Settlement = {
  month: MonthKey;
  monthFirstDay: string;
  rent: FeeEntry | null;
  commonCost: FeeEntry | null;
  invoices: Invoice[];
  invoicesTotal: number;
  /** null when rent or common cost has no valid value for the month (never computed with 0). */
  total: number | null;
  missing: Array<"rent" | "common_cost">;
};

/**
 * Monthly settlement, computed on the fly (never stored):
 * - rent / common cost: latest value whose valid_from <= first day of the month
 * - invoices: every invoice whose invoice_date falls in the month, paid or not
 * - total = rent + common cost + invoices total (only if both fees exist)
 */
export function computeSettlement(
  fees: { rent: FeeEntry[]; common_cost: FeeEntry[] },
  invoices: Invoice[],
  month: MonthKey,
): Settlement {
  const monthFirstDay = `${month}-01`;
  const rent = getEffectiveEntry(fees.rent, monthFirstDay);
  const commonCost = getEffectiveEntry(fees.common_cost, monthFirstDay);
  const monthInvoices = invoices
    .filter((i) => i.invoice_date.slice(0, 7) === month)
    .sort((a, b) => a.invoice_date.localeCompare(b.invoice_date));
  const invoicesTotal = sumAmounts(monthInvoices.map((i) => i.amount));
  const missing: Settlement["missing"] = [];
  if (!rent) missing.push("rent");
  if (!commonCost) missing.push("common_cost");
  const total =
    rent && commonCost ? sumAmounts([rent.amount, commonCost.amount, invoicesTotal]) : null;
  return {
    month,
    monthFirstDay,
    rent,
    commonCost,
    invoices: monthInvoices,
    invoicesTotal,
    total,
    missing,
  };
}
