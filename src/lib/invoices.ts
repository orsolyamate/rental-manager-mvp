import { z } from "zod";
import { amountSchema, isRealDate, requiredDateSchema } from "./common";

export type Invoice = {
  id: string;
  provider_name: string | null;
  amount: number;
  invoice_date: string;
  due_date: string | null;
  paid: boolean;
  paid_date: string | null;
};

const optionalDate = z
  .string()
  .optional()
  .default("")
  .refine((v) => v === "" || isRealDate(v), "Érvénytelen dátum.");

/**
 * New invoice rules:
 * - provider name optional (empty -> null), max 200 chars
 * - amount required and > 0; invoice date required; due date optional
 * - paid = true  -> paid date required
 * - paid = false -> paid date stored as null
 */
export const newInvoiceSchema = z
  .object({
    providerName: z
      .string()
      .optional()
      .default("")
      .transform((v) => v.trim())
      .refine((v) => v.length <= 200, "A megnevezés legfeljebb 200 karakter lehet."),
    amount: amountSchema,
    invoiceDate: requiredDateSchema("Add meg a számla dátumát."),
    dueDate: optionalDate,
    paid: z.boolean({ required_error: "Add meg, hogy fizetve van-e." }),
    paidDate: optionalDate,
  })
  .superRefine((v, ctx) => {
    if (v.paid && v.paidDate === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paidDate"],
        message: "Fizetett számlánál add meg a fizetés dátumát.",
      });
    }
  })
  .transform((v) => ({
    providerName: v.providerName === "" ? null : v.providerName,
    amount: v.amount,
    invoiceDate: v.invoiceDate,
    dueDate: v.dueDate === "" ? null : v.dueDate,
    paid: v.paid,
    paidDate: v.paid ? v.paidDate : null,
  }));

export type NewInvoiceInput = z.input<typeof newInvoiceSchema>;
export type NewInvoice = z.output<typeof newInvoiceSchema>;

export const INVOICE_FIELDS = [
  "providerName",
  "amount",
  "invoiceDate",
  "dueDate",
  "paid",
  "paidDate",
] as const;
export type InvoiceField = (typeof INVOICE_FIELDS)[number];
