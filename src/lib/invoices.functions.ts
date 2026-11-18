import { createServerFn } from "@tanstack/react-start";
import { createPublicDbClient } from "./public-db";
import {
  INVOICE_FIELDS,
  invoicePaymentSchema,
  newInvoiceSchema,
  type Invoice,
  type InvoiceField,
} from "./invoices";

export const getInvoices = createServerFn({ method: "GET" }).handler(
  async (): Promise<Invoice[]> => {
    const supabase = createPublicDbClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("id, provider_name, amount, invoice_date, due_date, paid, paid_date")
      .order("invoice_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error("A számlák nem tölthetők be.");
    return data.map((r) => ({ ...r, amount: Number(r.amount) }));
  },
);

export type AddInvoiceResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Partial<Record<InvoiceField, string>> | undefined };

export const addInvoice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }): Promise<AddInvoiceResult> => {
    const parsed = newInvoiceSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<InvoiceField, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (INVOICE_FIELDS.includes(key as InvoiceField) && !fieldErrors[key as InvoiceField]) {
          fieldErrors[key as InvoiceField] = issue.message;
        }
      }
      return {
        ok: false,
        message: "A mentés nem sikerült: ellenőrizd a megjelölt mezőket.",
        fieldErrors,
      };
    }
    const v = parsed.data;
    const supabase = createPublicDbClient();

    const { data: apartment, error: aptError } = await supabase
      .from("apartments")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (aptError || !apartment) return { ok: false, message: "A lakás nem található." };

    const { error } = await supabase.from("invoices").insert({
      apartment_id: apartment.id,
      provider_name: v.providerName,
      amount: v.amount,
      invoice_date: v.invoiceDate,
      due_date: v.dueDate,
      paid: v.paid,
      paid_date: v.paidDate,
    });

    if (error) {
      console.error("addInvoice failed", error.code, error.message);
      return { ok: false, message: "A mentés nem sikerült. Kérlek, próbáld újra." };
    }
    return { ok: true };
  });

export type UpdatePaymentResult =
  { ok: true } | { ok: false; message: string; field?: "paidDate" | undefined };

// Only paid / paid_date are sent; the database also grants UPDATE on just these two columns.
export const updateInvoicePayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }): Promise<UpdatePaymentResult> => {
    const parsed = invoicePaymentSchema.safeParse(data);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return {
        ok: false,
        message: issue?.message ?? "Hibás adatok.",
        field: issue?.path[0] === "paidDate" ? "paidDate" : undefined,
      };
    }
    const { id, paid, paidDate } = parsed.data;
    const supabase = createPublicDbClient();
    const { data: rows, error } = await supabase
      .from("invoices")
      .update({ paid, paid_date: paidDate })
      .eq("id", id)
      .select("id");

    if (error) {
      console.error("updateInvoicePayment failed", error.code, error.message);
      return { ok: false, message: "A mentés nem sikerült. Kérlek, próbáld újra." };
    }
    if (!rows || rows.length === 0) return { ok: false, message: "A számla nem található." };
    return { ok: true };
  });
