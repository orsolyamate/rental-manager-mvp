import { useId, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { parseAmountInput } from "@/lib/common";
import { addInvoice } from "@/lib/invoices.functions";
import { newInvoiceSchema, type InvoiceField, type NewInvoice } from "@/lib/invoices";

type FieldErrors = Partial<Record<InvoiceField, string | undefined>>;

export function NewInvoiceForm({ onDone }: { onDone: () => void }) {
  const id = useId();
  const [providerName, setProviderName] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paid, setPaid] = useState(false);
  const [paidDate, setPaidDate] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const queryClient = useQueryClient();
  const addInvoiceFn = useServerFn(addInvoice);

  const mutation = useMutation({
    mutationFn: (input: NewInvoice) =>
      addInvoiceFn({
        data: {
          providerName: input.providerName ?? "",
          amount: input.amount,
          invoiceDate: input.invoiceDate,
          dueDate: input.dueDate ?? "",
          paid: input.paid,
          paidDate: input.paidDate ?? "",
        },
      }),
    onSuccess: async (result) => {
      if (!result.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("A számla sikeresen mentve.");
      onDone();
    },
    onError: () => toast.error("A mentés nem sikerült. Ellenőrizd a kapcsolatot, és próbáld újra."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = newInvoiceSchema.safeParse({
      providerName,
      amount: amount.trim() === "" ? undefined : parseAmountInput(amount),
      invoiceDate,
      dueDate,
      paid,
      paidDate: paid ? paidDate : "",
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as InvoiceField;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("A mentés nem sikerült: ellenőrizd a megjelölt mezőket.");
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  function handlePaidChange(checked: boolean) {
    setPaid(checked);
    if (!checked) {
      setPaidDate("");
      setErrors((prev) => ({ ...prev, paidDate: undefined }));
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg">Új számla</CardTitle>
        <p className="text-sm text-muted-foreground">A *-gal jelölt mezők kötelezők.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${id}-provider`} label="Szolgáltató / megnevezés" error={errors.providerName}>
              <Input
                id={`${id}-provider`}
                placeholder="pl. MVM Next – villany"
                maxLength={200}
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                aria-invalid={!!errors.providerName}
              />
            </Field>
            <Field id={`${id}-amount`} label="Összeg (Ft) *" error={errors.amount}>
              <Input
                id={`${id}-amount`}
                inputMode="decimal"
                autoComplete="off"
                placeholder="pl. 8 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={!!errors.amount}
              />
            </Field>
            <Field id={`${id}-invoice-date`} label="Számla dátuma *" error={errors.invoiceDate}>
              <Input
                id={`${id}-invoice-date`}
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                aria-invalid={!!errors.invoiceDate}
              />
            </Field>
            <Field id={`${id}-due-date`} label="Fizetési határidő" error={errors.dueDate}>
              <Input
                id={`${id}-due-date`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-invalid={!!errors.dueDate}
              />
            </Field>
          </div>

          <div className="grid gap-4 rounded-lg bg-secondary/60 p-4 sm:grid-cols-2 sm:items-start">
            <div className="flex min-h-10 items-center gap-3">
              <Switch id={`${id}-paid`} checked={paid} onCheckedChange={handlePaidChange} />
              <Label htmlFor={`${id}-paid`} className="cursor-pointer">
                Fizetve: <span className="font-semibold">{paid ? "igen" : "nem"}</span>
              </Label>
            </div>
            {paid ? (
              <Field id={`${id}-paid-date`} label="Fizetés dátuma *" error={errors.paidDate}>
                <Input
                  id={`${id}-paid-date`}
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  aria-invalid={!!errors.paidDate}
                />
              </Field>
            ) : (
              <p className="text-sm text-muted-foreground sm:pt-2.5">
                Nem fizetett számlánál a fizetés dátuma üres marad.
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
              Mégse
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Mentés…" : "Mentés"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
