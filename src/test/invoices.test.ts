import { describe, expect, it } from "vitest";
import { invoicePaymentSchema, newInvoiceSchema } from "@/lib/invoices";

const base = {
  providerName: "Fővárosi Vízművek",
  amount: 5230,
  invoiceDate: "2026-11-12",
  dueDate: "2026-11-27",
  paid: false,
  paidDate: "",
};

function errorsOf(input: unknown) {
  const r = newInvoiceSchema.safeParse(input);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
}

describe("new invoice validation", () => {
  it("saves without provider name and due date (both optional) and stores them as null", () => {
    const r = newInvoiceSchema.parse({ ...base, providerName: "  ", dueDate: "" });
    expect(r.providerName).toBeNull();
    expect(r.dueDate).toBeNull();
  });

  it.each([0, -1, -5230])("rejects amount %s", (amount) => {
    expect(errorsOf({ ...base, amount }).amount).toBe(
      "Az összegnek nullánál nagyobbnak kell lennie.",
    );
  });

  it("requires the amount", () => {
    expect(errorsOf({ ...base, amount: undefined }).amount).toBe("Add meg az összeget.");
  });

  it("requires the invoice date", () => {
    expect(errorsOf({ ...base, invoiceDate: "" }).invoiceDate).toBe("Add meg a számla dátumát.");
  });

  it("paid = true requires a paid date", () => {
    expect(errorsOf({ ...base, paid: true, paidDate: "" }).paidDate).toBe(
      "Fizetett számlánál add meg a fizetés dátumát.",
    );
  });

  it("paid = true keeps the paid date", () => {
    expect(newInvoiceSchema.parse({ ...base, paid: true, paidDate: "2026-11-20" }).paidDate).toBe(
      "2026-11-20",
    );
  });

  it("paid = false always stores paid date as null", () => {
    expect(
      newInvoiceSchema.parse({ ...base, paid: false, paidDate: "2026-11-20" }).paidDate,
    ).toBeNull();
  });

  it("rejects impossible dates", () => {
    expect(errorsOf({ ...base, dueDate: "2026-02-30" }).dueDate).toBe("Érvénytelen dátum.");
  });
});

describe("invoice payment status change", () => {
  const id = "3f1c2b4a-5d6e-4f70-8a91-b2c3d4e5f607";

  it("TC-18: paid with a date is accepted and keeps the date", () => {
    expect(invoicePaymentSchema.parse({ id, paid: true, paidDate: "2026-11-17" })).toEqual({
      id,
      paid: true,
      paidDate: "2026-11-17",
    });
  });

  it("TC-19: back to unpaid always clears the paid date (null)", () => {
    expect(
      invoicePaymentSchema.parse({ id, paid: false, paidDate: "2026-11-17" }).paidDate,
    ).toBeNull();
  });

  it("TC-20: paid without a date is rejected with a clear message", () => {
    const r = invoicePaymentSchema.safeParse({ id, paid: true, paidDate: "" });
    expect(r.success).toBe(false);
    expect(r.success ? "" : r.error.issues[0]?.message).toBe(
      "Fizetett számlánál add meg a fizetés dátumát.",
    );
  });

  it("only carries id, paid and paid date (amount and other fields are dropped)", () => {
    const r = invoicePaymentSchema.parse({
      id,
      paid: false,
      paidDate: "",
      amount: 1,
      providerName: "X",
    });
    expect(Object.keys(r).sort()).toEqual(["id", "paid", "paidDate"]);
  });

  it("rejects an invalid invoice id", () => {
    expect(invoicePaymentSchema.safeParse({ id: "abc", paid: false, paidDate: "" }).success).toBe(
      false,
    );
  });
});
