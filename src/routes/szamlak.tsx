import { useState } from "react";
import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useQueryErrorResetBoundary, useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { InvoiceList } from "@/components/invoice-list";
import { NewInvoiceForm } from "@/components/new-invoice-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { invoicesQueryOptions } from "@/lib/invoices.queries";

export const Route = createFileRoute("/szamlak")({
  head: () => ({
    meta: [
      { title: "Számlák – Rental Manager" },
      { name: "description", content: "A lakáshoz kapcsolódó számlák rögzítése és áttekintése." },
      { property: "og:title", content: "Számlák – Rental Manager" },
      { property: "og:description", content: "A lakáshoz kapcsolódó számlák rögzítése és áttekintése." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(invoicesQueryOptions());
  },
  component: InvoicesPage,
  errorComponent: InvoicesError,
});

function InvoicesPage() {
  const { data: invoices } = useSuspenseQuery(invoicesQueryOptions());
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          className="mb-0 sm:mb-0"
          title="Számlák"
          description="A lakáshoz kapcsolódó számlák nyilvántartása."
        />
        {!formOpen ? (
          <Button size="lg" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Új számla
          </Button>
        ) : null}
      </div>

      <div className="space-y-6">
        {formOpen ? <NewInvoiceForm onDone={() => setFormOpen(false)} /> : null}
        <InvoiceList invoices={invoices} />
      </div>
    </>
  );
}

function InvoicesError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();
  return (
    <>
      <PageHeader title="Számlák" />
      <Card className="border-destructive/40">
        <CardContent className="space-y-4 p-6">
          <p role="alert" className="text-sm text-foreground">
            A számlák betöltése nem sikerült. {error instanceof Error ? error.message : ""}
          </p>
          <Button
            onClick={() => {
              queryErrorResetBoundary.reset();
              reset();
              router.invalidate();
            }}
          >
            Újrapróbálás
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
