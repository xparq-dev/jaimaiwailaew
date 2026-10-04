import {
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

import type {
  TaxRuleSourceRegistrySource,
  TaxRuleSourceRegistryYear,
} from "@/tax/tax-rule-source-registry";
import type { EvidenceLevel, TaxCalculationScope } from "@/tax/types";

function formatThaiDate(value: string | null): string {
  if (!value) {
    return "ยังไม่ระบุวันที่ตรวจทาน";
  }

  const parsed = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "ยังไม่ระบุวันที่ตรวจทาน";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(parsed);
}

function getEvidenceLabel(level: EvidenceLevel): string {
  switch (level) {
    case "primary_official":
      return "แหล่งทางการระดับต้น";
    case "secondary_official":
      return "แหล่งทางการประกอบ";
    case "professional_review":
      return "ผ่านการทบทวนโดยผู้เชี่ยวชาญ";
    case "unverified":
      return "ยังไม่ยืนยัน";
  }
}

function getScopeLabel(scope: TaxCalculationScope): string {
  switch (scope) {
    case "personal-income-tax-estimate":
      return "ประมาณการภาษีเงินได้บุคคลธรรมดา";
    case "pnd91-estimate":
      return "ประมาณการ ภ.ง.ด.91";
    case "pnd94-estimate":
      return "ประมาณการ ภ.ง.ด.94";
  }
}

function SourceRow({
  source,
}: {
  readonly source: TaxRuleSourceRegistrySource;
}) {
  return (
    <li className="border-border grid gap-3 border-t py-4 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-5">
      <div className="min-w-0">
        <h3 className="text-sm leading-6 font-semibold text-balance">
          {source.title}
        </h3>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          {source.authority}
        </p>
        <p className="text-muted-foreground mt-2 text-xs leading-5">
          {getEvidenceLabel(source.evidenceLevel)} · ตรวจทานล่าสุด{" "}
          {formatThaiDate(source.lastCheckedAt)}
        </p>
      </div>
      <a
        className="focus-visible:ring-focus/35 text-primary inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-sm font-semibold hover:underline focus-visible:ring-3 focus-visible:outline-none"
        href={source.url}
        rel="noreferrer noopener"
        target="_blank"
      >
        เปิดแหล่งอ้างอิง
        <ExternalLink aria-hidden="true" className="size-4" />
      </a>
    </li>
  );
}

function RegistryYear({
  entry,
}: {
  readonly entry: TaxRuleSourceRegistryYear;
}) {
  const StatusIcon = entry.calculationAvailable ? CheckCircle2 : ShieldAlert;

  return (
    <section
      aria-labelledby={`tax-rule-year-${entry.taxYearBE}`}
      className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-6"
      id={`tax-rule-year-${entry.taxYearBE}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={
              entry.calculationAvailable
                ? "rounded-xl bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300"
                : "bg-warning-soft text-warning-strong rounded-xl p-2"
            }
          >
            <StatusIcon aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2
              className="text-xl font-bold"
              id={`tax-rule-year-${entry.taxYearBE}`}
            >
              กฎภาษีปี {entry.taxYearBE}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {entry.taxYearCE
                ? `ค.ศ. ${entry.taxYearCE}`
                : "ปีคริสต์ศักราชยังไม่ระบุ"}
            </p>
          </div>
        </div>
        <span
          className={
            entry.calculationAvailable
              ? "inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
              : "text-warning-strong bg-warning-soft border-warning/30 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold"
          }
        >
          {entry.calculationAvailable
            ? "พร้อมใช้สำหรับการประมาณการ"
            : "ยังไม่พร้อมใช้สำหรับการประมาณการ"}
        </span>
      </div>

      <dl className="border-border mt-5 grid gap-3 border-y py-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">เวอร์ชันที่เผยแพร่</dt>
          <dd className="mt-1 font-semibold">
            {entry.version ? `v${entry.version}` : "ยังไม่ระบุ"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">ตรวจทานล่าสุด</dt>
          <dd className="mt-1 font-semibold">
            {formatThaiDate(entry.lastReviewedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">ขอบเขตที่แอปรองรับ</dt>
          <dd className="mt-1 font-semibold">{entry.scope.length} รายการ</dd>
        </div>
      </dl>

      {entry.scope.length > 0 ? (
        <ul
          className="mt-4 flex flex-wrap gap-2"
          aria-label="ขอบเขตการประมาณการ"
        >
          {entry.scope.map((scope) => (
            <li
              className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
              key={scope}
            >
              {getScopeLabel(scope)}
            </li>
          ))}
        </ul>
      ) : null}

      <details className="border-border mt-5 rounded-xl border" open>
        <summary className="focus-visible:ring-focus/35 flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:ring-3 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <BookOpenCheck aria-hidden="true" className="text-primary size-4" />
            แหล่งอ้างอิงที่เผยแพร่ ({entry.sources.length})
          </span>
          <span className="text-muted-foreground text-xs">
            แตะเพื่อย่อ/ขยาย
          </span>
        </summary>
        <div className="border-border border-t px-4 sm:px-5">
          {entry.sources.length > 0 ? (
            <ul>
              {entry.sources.map((source) => (
                <SourceRow
                  key={`${source.url}-${source.title}`}
                  source={source}
                />
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground py-5 text-sm">
              ยังไม่มีแหล่งอ้างอิงที่พร้อมเผยแพร่สำหรับปีนี้
            </p>
          )}
        </div>
      </details>
    </section>
  );
}

export function TaxRuleSourceRegistry({
  entries,
}: {
  readonly entries: readonly TaxRuleSourceRegistryYear[];
}) {
  return (
    <div className="space-y-5">
      {entries.map((entry) => (
        <RegistryYear entry={entry} key={entry.taxYearBE} />
      ))}
    </div>
  );
}
