import {
  createFileRoute,
  useNavigate,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useQueryErrorResetBoundary, useSuspenseQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/page-header";
import { SettlementInvoicesCard } from "@/components/settlement-invoices-card";
import { SettlementMonthPicker } from "@/components/settlement-month-picker";
import { SettlementSummaryCard } from "@/components/settlement-summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { feesQueryOptions } from "@/lib/fees.queries";
import { invoicesQueryOptions } from "@/lib/invoices.queries";
import {
  computeSettlement,
  currentMonthKey,
  isMonthKey,
  monthOptions,
  type MonthKey,
} from "@/lib/settlement";

const DESCRIPTION = "A kiválasztott hónap lakbér-, közös költség- és számlaösszesítője.";

export const Route = createFileRoute("/havi-elszamolas")({
  // Selected month lives in the URL (?honap=YYYY-MM) so reload / sharing keeps it.
  // Invalid values are explicitly cleared (unknown search keys would otherwise pass through).
  validateSearch: (search: Record<string, unknown>): { honap?: MonthKey | undefined } => ({
    honap: isMonthKey(search["honap"]) ? search["honap"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Havi elszámolás – Rental Manager" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Havi elszámolás – Rental Manager" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(feesQueryOptions()),
      context.queryClient.ensureQueryData(invoicesQueryOptions()),
    ]);
  },
  component: MonthlySettlementPage,
  errorComponent: SettlementError,
});

function MonthlySettlementPage() {
  const { data: fees } = useSuspenseQuery(feesQueryOptions());
  const { data: invoices } = useSuspenseQuery(invoicesQueryOptions());
  const { honap } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const current = currentMonthKey();
  const month = isMonthKey(honap) ? honap : current;
  const settlement = computeSettlement(fees, invoices, month);
  const options = monthOptions(
    [
      ...fees.rent.map((f) => f.valid_from),
      ...fees.common_cost.map((f) => f.valid_from),
      ...invoices.map((i) => i.invoice_date),
    ],
    current,
    month,
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          className="mb-0 sm:mb-0"
          title="Havi elszámolás"
          description="Lakbér + közös költség + a hónap számlái."
        />
        <SettlementMonthPicker
          value={month}
          options={options}
          onChange={(m) => navigate({ search: { honap: m } })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <SettlementSummaryCard settlement={settlement} />
        <SettlementInvoicesCard invoices={settlement.invoices} total={settlement.invoicesTotal} />
      </div>
    </>
  );
}

function SettlementError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();
  return (
    <>
      <PageHeader title="Havi elszámolás" />
      <Card className="border-destructive/40">
        <CardContent className="space-y-4 p-6">
          <p role="alert" className="text-sm text-foreground">
            Az elszámolás adatai nem tölthetők be. {error instanceof Error ? error.message : ""}
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
