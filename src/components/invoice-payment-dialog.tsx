import { useEffect, useId, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDate, formatHuf } from "@/lib/common";
import { invoicePaymentSchema, type Invoice, type InvoicePayment } from "@/lib/invoices";
import { updateInvoicePayment } from "@/lib/invoices.functions";

export function InvoicePaymentDialog({
  invoice,
  onOpenChange,
}: {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const [paid, setPaid] = useState(false);
  const [paidDate, setPaidDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const updateFn = useServerFn(updateInvoicePayment);

  // Load the selected invoice's current state each time the dialog opens
  useEffect(() => {
    if (invoice) {
      setPaid(invoice.paid);
      setPaidDate(invoice.paid_date ?? "");
      setError(null);
    }
  }, [invoice]);

  const mutation = useMutation({
    mutationFn: (input: InvoicePayment) =>
      updateFn({ data: { id: input.id, paid: input.paid, paidDate: input.paidDate ?? "" } }),
    onSuccess: async (result) => {
      if (!result.ok) {
        if (result.field === "paidDate") setError(result.message);
        toast.error(result.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("A fizetési státusz sikeresen mentve.");
      onOpenChange(false);
    },
    onError: () => toast.error("A mentés nem sikerült. Ellenőrizd a kapcsolatot, és próbáld újra."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    const parsed = invoicePaymentSchema.safeParse({
      id: invoice.id,
      paid,
      paidDate: paid ? paidDate : "",
    });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Hibás adatok.";
      setError(msg);
      toast.error("A mentés nem sikerült: ellenőrizd a megjelölt mezőt.");
      return;
    }
    setError(null);
    mutation.mutate(parsed.data);
  }

  function handlePaidChange(checked: boolean) {
    setPaid(checked);
    if (!checked) {
      setPaidDate("");
      setError(null);
    }
  }

  return (
    <Dialog open={invoice !== null} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fizetési státusz</DialogTitle>
          <DialogDescription>
            {invoice ? (
              <>
                {invoice.provider_name ?? "Megnevezés nélküli számla"} · {formatHuf(invoice.amount)}{" "}
                · {formatDate(invoice.invoice_date)}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="flex min-h-10 items-center gap-3">
            <Switch id={`${id}-paid`} checked={paid} onCheckedChange={handlePaidChange} />
            <Label htmlFor={`${id}-paid`} className="cursor-pointer">
              Fizetve: <span className="font-semibold">{paid ? "igen" : "nem"}</span>
            </Label>
          </div>

          {paid ? (
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-paid-date`}>Fizetés dátuma *</Label>
              <Input
                id={`${id}-paid-date`}
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                aria-invalid={!!error}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nem fizetett számlánál a fizetés dátuma üres marad.
            </p>
          )}

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Mégse
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Mentés…" : "Mentés"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
