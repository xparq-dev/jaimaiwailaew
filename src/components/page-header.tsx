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
    <header className="max-w-3xl">
      <p className="text-secondary text-sm font-semibold">{eyebrow}</p>
      <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      <p className="text-muted-foreground mt-4 text-base leading-7 text-pretty sm:text-lg">
        {description}
      </p>
      {actions ? (
        <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
