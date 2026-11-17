import type { ReactNode } from "react";

export function PageHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {description ? <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p> : null}
    </div>
  );
}
