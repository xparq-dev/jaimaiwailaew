import { CalendarDays, ExternalLink, FileText } from "lucide-react";

import type { TaxCalendarEntry } from "@/tax/tax-calendar";

function formatThaiDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00+07:00`);

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeZone: "Asia/Bangkok",
  }).format(parsed);
}

function CalendarEntry({ entry }: { readonly entry: TaxCalendarEntry }) {
  return (
    <article className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-primary/10 text-primary rounded-xl p-2">
            <CalendarDays aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-secondary text-sm font-semibold">
              ปีภาษี {entry.taxYearBE}
            </p>
            <h2 className="mt-1 text-xl font-bold text-balance">
              {entry.title}
            </h2>
          </div>
        </div>
        <span className="bg-muted text-foreground inline-flex rounded-full px-3 py-1.5 text-sm font-semibold">
          {entry.formLabel}
        </span>
      </div>

      <p className="text-muted-foreground mt-4 text-sm leading-6">
        {entry.description}
      </p>

      <dl className="border-border mt-5 grid gap-3 border-y py-4 sm:grid-cols-2">
        {entry.channels.map((channel) => (
          <div key={`${entry.formLabel}-${channel.label}`}>
            <dt className="text-muted-foreground text-sm">{channel.label}</dt>
            <dd className="text-foreground mt-1 text-lg font-bold">
              {formatThaiDate(channel.deadline)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground flex min-w-0 items-start gap-2 text-sm leading-6">
          <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="block font-medium text-balance">
              {entry.source.title}
            </span>
            <span className="block">
              ตรวจข้อมูลจาก{entry.source.authority} เมื่อ{" "}
              {formatThaiDate(entry.source.checkedAt)}
            </span>
          </span>
        </p>
        <a
          aria-label={`เปิดแหล่งอ้างอิงของ ${entry.formLabel}`}
          className="focus-visible:ring-focus/35 text-primary inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-sm font-semibold hover:underline focus-visible:ring-3 focus-visible:outline-none"
          href={entry.source.url}
          rel="noreferrer noopener"
          target="_blank"
        >
          เปิดข้อมูลจากกรมสรรพากร
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </div>
    </article>
  );
}

export function TaxCalendar({
  entries,
}: {
  readonly entries: readonly TaxCalendarEntry[];
}) {
  return (
    <section aria-labelledby="verified-tax-calendar-heading">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays aria-hidden="true" className="text-primary size-5" />
        <h2 className="text-xl font-bold" id="verified-tax-calendar-heading">
          กำหนดเวลาที่ยืนยันแล้ว
        </h2>
      </div>
      <div className="space-y-5">
        {entries.map((entry) => (
          <CalendarEntry
            entry={entry}
            key={`${entry.taxYearBE}-${entry.formLabel}`}
          />
        ))}
      </div>
    </section>
  );
}
