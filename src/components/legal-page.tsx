import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";

export interface LegalSection {
  title: string;
  content: ReactNode;
}

export function LegalPage({
  eyebrow,
  title,
  description,
  notice,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  notice: string;
  sections: readonly LegalSection[];
}) {
  return (
    <div className="space-y-8">
      <PageHeader description={description} eyebrow={eyebrow} title={title} />
      <div className="border-warning/30 bg-warning-soft text-warning-strong flex gap-3 rounded-2xl border p-4 text-sm leading-6">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p>{notice}</p>
      </div>
      <article className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-8">
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <div className="text-muted-foreground mt-3 space-y-3 text-sm leading-7">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
