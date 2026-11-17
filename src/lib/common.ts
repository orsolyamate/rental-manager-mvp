import { z } from "zod";

/**
 * Hungarian forint format with a space as thousands separator even for 4-digit amounts
 * ("8 540 Ft", "220 000 Ft", "1 500,5 Ft"). Implemented by hand because Intl's hu-HU
 * locale does not group 4-digit numbers.
 */
export function formatHuf(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const [int = "0", dec] = Math.abs(amount).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  const decimals = dec && dec !== "00" ? `,${dec.replace(/0$/, "")}` : "";
  return `${sign}${grouped}${decimals}\u00a0Ft`;
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

export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Shared money rule: required, a number, > 0, at most 2 decimals. */
export const amountSchema = z
  .number({
    invalid_type_error: "Az összeg csak szám lehet.",
    required_error: "Add meg az összeget.",
  })
  .refine((n) => Number.isFinite(n), "Az összeg csak szám lehet.")
  .refine((n) => n > 0, "Az összegnek nullánál nagyobbnak kell lennie.")
  .refine((n) => n < 10_000_000_000, "Az összeg túl nagy.")
  .refine((n) => Math.round(n * 100) === n * 100, "Legfeljebb két tizedesjegy adható meg.");

/** Required ISO date (YYYY-MM-DD) with a custom "missing" message. */
export const requiredDateSchema = (missingMessage: string) =>
  z
    .string({ required_error: missingMessage })
    .min(1, missingMessage)
    .refine((v) => v === "" || isRealDate(v), "Érvénytelen dátum.");
