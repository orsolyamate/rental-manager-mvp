import { useId, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFee } from "@/lib/fees.functions";
import { FEE_LABELS, newFeeSchema, parseAmountInput, type FeeKind } from "@/lib/fees";

type FieldErrors = { amount?: string; validFrom?: string };

export function NewFeeForm({ kind, onDone }: { kind: FeeKind; onDone: () => void }) {
  const id = useId();
  const [amount, setAmount] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const queryClient = useQueryClient();
  const addFeeFn = useServerFn(addFee);
  const label = FEE_LABELS[kind];

  const mutation = useMutation({
    mutationFn: (input: { kind: FeeKind; amount: number; validFrom: string }) =>
      addFeeFn({ data: input }),
    onSuccess: async (result) => {
      if (!result.ok) {
        if (result.field) setErrors({ [result.field]: result.message });
        toast.error(result.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast.success(`${label} sikeresen mentve.`);
      onDone();
    },
    onError: () => toast.error("A mentés nem sikerült. Ellenőrizd a kapcsolatot, és próbáld újra."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = {
      kind,
      amount: amount.trim() === "" ? undefined : parseAmountInput(amount),
      validFrom,
    };
    const parsed = newFeeSchema.safeParse(input);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("A mentés nem sikerült: ellenőrizd a megjelölt mezőket.");
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-4 space-y-4 rounded-lg border bg-background p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-amount`}>Összeg (Ft)</Label>
          <Input
            id={`${id}-amount`}
            inputMode="decimal"
            autoComplete="off"
            placeholder="pl. 230 000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? `${id}-amount-error` : undefined}
          />
          {errors.amount ? (
            <p id={`${id}-amount-error`} className="text-sm text-destructive">
              {errors.amount}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-date`}>Hatálybalépés dátuma</Label>
          <Input
            id={`${id}-date`}
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            aria-invalid={!!errors.validFrom}
            aria-describedby={errors.validFrom ? `${id}-date-error` : undefined}
          />
          {errors.validFrom ? (
            <p id={`${id}-date-error`} className="text-sm text-destructive">
              {errors.validFrom}
            </p>
          ) : null}
        </div>
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
  );
}
