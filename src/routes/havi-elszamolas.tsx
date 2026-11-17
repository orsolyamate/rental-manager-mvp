import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/havi-elszamolas")({
  head: () => ({
    meta: [
      { title: "Havi elszámolás – Rental Manager" },
      { name: "description", content: "A kiválasztott hónap lakbér-, közös költség- és számlaösszesítője." },
      { property: "og:title", content: "Havi elszámolás – Rental Manager" },
      { property: "og:description", content: "A kiválasztott hónap lakbér-, közös költség- és számlaösszesítője." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MonthlySettlementPage,
});

function MonthlySettlementPage() {
  return (
    <>
      <PageHeader title="Havi elszámolás" description="A kiválasztott hónap összesítője." />
      <ComingSoon text="A havi elszámolás egy későbbi fejlesztési lépésben készül el." />
    </>
  );
}
