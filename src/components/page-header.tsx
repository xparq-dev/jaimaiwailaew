import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="border-border grid gap-5 border-b pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="max-w-3xl">
        <p className="text-secondary text-sm font-semibold">{eyebrow}</p>
        <h1 className="text-foreground mt-1.5 text-3xl font-bold tracking-tight text-balance sm:text-[2.25rem]">
          {title}
        </h1>
        <p className="text-muted-foreground mt-2.5 max-w-2xl text-sm leading-6 text-pretty sm:text-base">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div>
      ) : null}
    </header>
  );
}
