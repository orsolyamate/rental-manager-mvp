import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useQueryErrorResetBoundary, useSuspenseQuery } from "@tanstack/react-query";
import { Building2, MapPin, User } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fixedDataQueryOptions } from "@/lib/fixed-data.queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Áttekintés – Rental Manager" },
      { name: "description", content: "A kiadott lakás és az aktuális bérlő alapadatai egy helyen." },
      { property: "og:title", content: "Áttekintés – Rental Manager" },
      { property: "og:description", content: "A kiadott lakás és az aktuális bérlő alapadatai egy helyen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(fixedDataQueryOptions()),
  component: OverviewPage,
  errorComponent: OverviewError,
});

function OverviewPage() {
  const { data } = useSuspenseQuery(fixedDataQueryOptions());
  const { apartment, tenant } = data;

  return (
    <>
      <PageHeader title="Áttekintés" description="A lakás és az aktuális bérlő alapadatai." />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg">Lakás és bérlő</CardTitle>
          <p className="text-sm text-muted-foreground">Előre rögzített adatok, csak megtekinthetők.</p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem icon={<Building2 className="h-4 w-4" />} label="Lakás megnevezése" value={apartment.name} />
            <InfoItem icon={<MapPin className="h-4 w-4" />} label="Cím" value={apartment.address} />
            <InfoItem
              icon={<User className="h-4 w-4" />}
              label="Aktuális bérlő"
              value={tenant?.name ?? "Nincs rögzített bérlő"}
            />
          </dl>
        </CardContent>
      </Card>
    </>
  );
}

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 gap-3 rounded-lg bg-secondary/60 p-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-card text-primary" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="mt-1 break-words font-medium text-foreground">{value}</dd>
      </div>
    </div>
  );
}

function OverviewError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  return (
    <>
      <PageHeader title="Áttekintés" />
      <Card className="border-destructive/40">
        <CardContent className="space-y-4 p-6">
          <p role="alert" className="text-sm text-foreground">
            Az adatok betöltése nem sikerült. {error instanceof Error ? error.message : ""}
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
