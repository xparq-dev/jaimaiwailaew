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
    <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="max-w-3xl">
        <p className="text-secondary text-xs font-bold tracking-[0.08em] uppercase">
          {eyebrow}
        </p>
        <h1 className="text-foreground mt-2 text-3xl font-bold tracking-[-0.035em] text-balance sm:text-[2.5rem] sm:leading-[1.15]">
          {title}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6 text-pretty sm:text-base">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div>
      ) : null}
    </header>
  );
}
