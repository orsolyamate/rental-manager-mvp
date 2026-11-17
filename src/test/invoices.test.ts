import { describe, expect, it } from "vitest";
import { newInvoiceSchema } from "@/lib/invoices";

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
    expect(errorsOf({ ...base, amount }).amount).toBe("Az összegnek nullánál nagyobbnak kell lennie.");
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
    expect(newInvoiceSchema.parse({ ...base, paid: false, paidDate: "2026-11-20" }).paidDate).toBeNull();
  });

  it("rejects impossible dates", () => {
    expect(errorsOf({ ...base, dueDate: "2026-02-30" }).dueDate).toBe("Érvénytelen dátum.");
  });
});
