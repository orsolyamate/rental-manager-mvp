import { describe, expect, it } from "vitest";
import {
  currentMonthStart,
  formatDate,
  formatHuf,
  getEffectiveEntry,
  getUpcomingEntries,
  monthStart,
  newFeeSchema,
  parseAmountInput,
  type FeeEntry,
} from "@/lib/fees";

// Example from the data model document
const rent: FeeEntry[] = [
  { id: "a", amount: 180000, valid_from: "2026-01-01" },
  { id: "b", amount: 195000, valid_from: "2026-07-01" },
  { id: "c", amount: 210000, valid_from: "2027-01-01" },
];

describe("effective fee for a month (latest valid_from <= first day of month)", () => {
  it("2026. október -> 195 000 Ft (spec example)", () => {
    expect(getEffectiveEntry(rent, monthStart(2026, 10))?.amount).toBe(195000);
  });

  it("a value takes effect in the month whose first day equals valid_from", () => {
    expect(getEffectiveEntry(rent, monthStart(2026, 7))?.amount).toBe(195000);
    expect(getEffectiveEntry(rent, monthStart(2026, 6))?.amount).toBe(180000);
    expect(getEffectiveEntry(rent, monthStart(2027, 1))?.amount).toBe(210000);
  });

  it("a mid-month valid_from only applies from the next month", () => {
    const entries: FeeEntry[] = [...rent, { id: "d", amount: 200000, valid_from: "2026-11-15" }];
    expect(getEffectiveEntry(entries, monthStart(2026, 11))?.amount).toBe(195000);
    expect(getEffectiveEntry(entries, monthStart(2026, 12))?.amount).toBe(200000);
  });

  it("returns null before the first recorded value", () => {
    expect(getEffectiveEntry(rent, monthStart(2025, 12))).toBeNull();
  });

  it("does not depend on input order", () => {
    expect(getEffectiveEntry([...rent].reverse(), monthStart(2026, 10))?.amount).toBe(195000);
  });

  it("lists values not yet effective as upcoming", () => {
    expect(getUpcomingEntries(rent, monthStart(2026, 11)).map((e) => e.amount)).toEqual([210000]);
  });
});

describe("current month uses Hungarian time", () => {
  it("23:30 UTC on 31 Oct is already November in Budapest", () => {
    expect(currentMonthStart(new Date("2026-10-31T23:30:00Z"))).toBe("2026-11-01");
  });
});

describe("new fee validation", () => {
  const base = { kind: "rent" as const, validFrom: "2026-12-01" };
  it("accepts a positive amount", () => {
    expect(newFeeSchema.safeParse({ ...base, amount: 230000 }).success).toBe(true);
  });
  it.each([0, -1, -230000])("rejects amount %s", (amount) => {
    expect(newFeeSchema.safeParse({ ...base, amount }).success).toBe(false);
  });
  it("rejects a missing amount", () => {
    expect(newFeeSchema.safeParse({ ...base, amount: undefined }).success).toBe(false);
  });
  it("rejects a missing or impossible date", () => {
    expect(newFeeSchema.safeParse({ ...base, amount: 1, validFrom: "" }).success).toBe(false);
    expect(newFeeSchema.safeParse({ ...base, amount: 1, validFrom: "2026-02-30" }).success).toBe(false);
  });
  it("parses Hungarian-style amount input", () => {
    expect(parseAmountInput("230 000")).toBe(230000);
    expect(parseAmountInput("1500,5")).toBe(1500.5);
    expect(parseAmountInput("abc")).toBeNaN();
  });
});

describe("formatting", () => {
  it("formats dates and forints the Hungarian way", () => {
    expect(formatDate("2026-07-01")).toBe("2026.07.01.");
    expect(formatHuf(220000).replace(/\s/g, " ")).toBe("220 000 Ft");
  });
});
