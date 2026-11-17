import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/szamlak")({
  head: () => ({
    meta: [
      { title: "Számlák – Rental Manager" },
      { name: "description", content: "A lakáshoz kapcsolódó számlák nyilvántartása." },
      { property: "og:title", content: "Számlák – Rental Manager" },
      { property: "og:description", content: "A lakáshoz kapcsolódó számlák nyilvántartása." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvoicesPage,
});

function InvoicesPage() {
  return (
    <>
      <PageHeader title="Számlák" description="A lakáshoz kapcsolódó számlák nyilvántartása." />
      <ComingSoon text="A számlák kezelése egy későbbi fejlesztési lépésben készül el." />
    </>
  );
}
