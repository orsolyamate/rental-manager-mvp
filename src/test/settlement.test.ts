import { describe, expect, it } from "vitest";
import type { FeeEntry } from "@/lib/fees";
import type { Invoice } from "@/lib/invoices";
import {
  computeSettlement,
  currentMonthKey,
  formatMonthLabel,
  isMonthKey,
  monthOptions,
  shiftMonth,
  sumAmounts,
} from "@/lib/settlement";

// Same values as the seeded database
const fees: { rent: FeeEntry[]; common_cost: FeeEntry[] } = {
  rent: [
    { id: "r1", amount: 200000, valid_from: "2026-01-01" },
    { id: "r2", amount: 220000, valid_from: "2026-07-01" },
  ],
  common_cost: [
    { id: "c1", amount: 25000, valid_from: "2026-01-01" },
    { id: "c2", amount: 27000, valid_from: "2026-07-01" },
  ],
};

const inv = (id: string, amount: number, invoice_date: string, paid: boolean): Invoice => ({
  id,
  provider_name: id,
  amount,
  invoice_date,
  due_date: null,
  paid,
  paid_date: paid ? invoice_date : null,
});

const invoices: Invoice[] = [
  inv("villany-okt", 8540, "2026-10-05", true),
  inv("viz-okt", 5230, "2026-10-12", true),
  inv("tavho-nov", 14860, "2026-11-03", true),
  inv("villany-nov", 9120, "2026-11-05", false),
  inv("egyeb-nov", 3000, "2026-11-09", false),
];

describe("monthly settlement", () => {
  it("2026. november: 220 000 + 27 000 + 26 980 = 273 980 Ft", () => {
    const s = computeSettlement(fees, invoices, "2026-11");
    expect(s.rent?.amount).toBe(220000);
    expect(s.commonCost?.amount).toBe(27000);
    expect(s.invoices.map((i) => i.id)).toEqual(["tavho-nov", "villany-nov", "egyeb-nov"]);
    expect(s.invoicesTotal).toBe(26980);
    expect(s.total).toBe(273980);
  });

  it("2026. október: 220 000 + 27 000 + 13 770 = 260 770 Ft", () => {
    const s = computeSettlement(fees, invoices, "2026-10");
    expect(s.invoicesTotal).toBe(13770);
    expect(s.total).toBe(260770);
  });

  it("uses the fee valid on the 1st of the month (June still the old fee)", () => {
    const s = computeSettlement(fees, invoices, "2026-06");
    expect(s.rent?.amount).toBe(200000);
    expect(s.commonCost?.amount).toBe(25000);
  });

  it("includes paid and unpaid invoices alike", () => {
    const s = computeSettlement(fees, invoices, "2026-11");
    expect(s.invoices.filter((i) => i.paid)).toHaveLength(1);
    expect(s.invoices.filter((i) => !i.paid)).toHaveLength(2);
  });

  it("assigns invoices by invoice_date month (31 Oct vs 1 Nov)", () => {
    const edge = [inv("a", 100, "2026-10-31", false), inv("b", 200, "2026-11-01", false)];
    expect(computeSettlement(fees, edge, "2026-10").invoices.map((i) => i.id)).toEqual(["a"]);
    expect(computeSettlement(fees, edge, "2026-11").invoices.map((i) => i.id)).toEqual(["b"]);
  });

  it("month without invoices: invoice total 0, total = rent + common cost", () => {
    const s = computeSettlement(fees, invoices, "2026-06");
    expect(s.invoices).toEqual([]);
    expect(s.invoicesTotal).toBe(0);
    expect(s.total).toBe(225000);
  });

  it("missing rent/common cost history: no total (not computed with 0)", () => {
    const s = computeSettlement(fees, invoices, "2025-12");
    expect(s.rent).toBeNull();
    expect(s.commonCost).toBeNull();
    expect(s.missing).toEqual(["rent", "common_cost"]);
    expect(s.total).toBeNull();
  });

  it("only one fee missing also gives no total", () => {
    const s = computeSettlement({ rent: fees.rent, common_cost: [] }, invoices, "2026-11");
    expect(s.missing).toEqual(["common_cost"]);
    expect(s.total).toBeNull();
    expect(s.invoicesTotal).toBe(26980);
  });

  it("sums decimals exactly", () => {
    expect(sumAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumAmounts([1500.55, 1499.45])).toBe(3000);
  });
});

describe("month helpers", () => {
  it("validates month keys", () => {
    expect(isMonthKey("2026-11")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("2026-1")).toBe(false);
    expect(isMonthKey(undefined)).toBe(false);
  });

  it("formats Hungarian month labels", () => {
    expect(formatMonthLabel("2026-11")).toBe("2026. november");
    expect(formatMonthLabel("2027-01")).toBe("2027. január");
  });

  it("shifts months across years", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("current month in Budapest time", () => {
    expect(currentMonthKey(new Date("2026-10-31T23:30:00Z"))).toBe("2026-11");
  });

  it("picker range: earliest data month .. current + 12, newest first, includes selection", () => {
    const opts = monthOptions(["2026-01-01", "2026-10-05"], "2026-11", "2026-11");
    expect(opts[0]).toBe("2027-11");
    expect(opts.at(-1)).toBe("2026-01");
    expect(opts).toHaveLength(23);
    expect(monthOptions(["2026-01-01"], "2026-11", "2025-06").at(-1)).toBe("2025-06");
  });
});
