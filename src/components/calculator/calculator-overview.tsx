"use client";

import {
  ArrowRight,
  Banknote,
  FileCheck2,
  Percent,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { computeArithmeticTotals } from "@/calculator/arithmetic";
import { getPersonaLabel } from "@/calculator/categories";
import { useCalculatorStore } from "@/calculator/store";
import { formatThaiDate } from "@/calculator/utils";
import { formatThaiBaht } from "@/tax/money";

import { CalculatorLayout } from "./calculator-layout";
import { WorkspacePersonaEditor } from "./workspace-persona-editor";

const sections = [
  {
    href: "/calculator/income",
    icon: Banknote,
    title: "รายรับ",
    description: "เพิ่มเงินเดือน ค่าจ้าง ยอดขาย หรือรายได้อื่น",
  },
  {
    href: "/calculator/expenses",
    icon: ReceiptText,
    title: "รายจ่าย",
    description: "บันทึกรายจ่ายและตรวจสถานะการจัดกลุ่ม",
  },
  {
    href: "/calculator/withholding-tax",
    icon: Percent,
    title: "ภาษีหัก ณ ที่จ่าย",
    description: "เก็บยอดตามเอกสารที่ได้รับจริง",
  },
  {
    href: "/calculator/allowances",
    icon: WalletCards,
    title: "ค่าลดหย่อน",
    description: "รวบรวมสิทธิและยอดที่ต้องการตรวจทาน",
  },
] as const;

export function CalculatorOverview() {
  const workspace = useCalculatorStore((state) => state.workspace);

  return (
    <CalculatorLayout
      description="ยอดรวมจากรายการที่บันทึกในปีภาษีนี้"
      eyebrow="ข้อมูลของฉัน"
      title="ภาพรวมการเงิน"
    >
      {workspace ? <CalculatorOverviewContent workspace={workspace} /> : null}
    </CalculatorLayout>
  );
}

function CalculatorOverviewContent({
  workspace,
}: {
  workspace: NonNullable<
    ReturnType<typeof useCalculatorStore.getState>["workspace"]
  >;
}) {
  const totals = computeArithmeticTotals(workspace);
  const updateWorkspacePersona = useCalculatorStore(
    (state) => state.updateWorkspacePersona,
  );
  const recordedItemCount =
    workspace.incomeEntries.length +
    workspace.expenseEntries.length +
    workspace.withholdingEntries.length +
    workspace.allowanceDraftEntries.length;

  return (
    <>
      <section
        aria-label="ชุดข้อมูลที่กำลังใช้"
        className="border-border flex flex-col gap-4 border-y py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.1em] uppercase">
            ชุดข้อมูลที่กำลังใช้
          </p>
          <h2 className="mt-1 truncate text-lg font-bold">
            {workspace.reportName?.trim() || getPersonaLabel(workspace.persona)}{" "}
            · ปีภาษี {workspace.taxYearBE}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatThaiDate(workspace.periodStart)} –{" "}
            {formatThaiDate(workspace.periodEnd)}
          </p>
        </div>
        <WorkspacePersonaEditor
          onSave={updateWorkspacePersona}
          persona={workspace.persona}
        />
      </section>

      <section
        aria-labelledby="financial-overview-heading"
        className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm"
      >
        <div className="border-border flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.1em] uppercase">
              สรุปยอด
            </p>
            <h2
              className="mt-1 text-xl font-bold"
              id="financial-overview-heading"
            >
              ยอดรวมที่บันทึก
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            {recordedItemCount} รายการทั้งหมด
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="bg-primary text-primary-foreground px-5 py-6 sm:px-6 sm:py-7">
            <p className="text-sm font-medium opacity-70">ส่วนต่างก่อนภาษี</p>
            <p className="financial-figures mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {formatThaiBaht(totals.netBeforeTaxSatang)}
            </p>
            <p className="mt-3 text-xs leading-5 opacity-65">
              รายรับหักรายจ่าย
            </p>
          </div>

          <dl className="divide-border grid divide-y px-5 sm:px-6">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-muted-foreground text-sm">รายรับรวม</dt>
              <dd className="financial-figures font-bold">
                {formatThaiBaht(totals.totalIncomeSatang)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-muted-foreground text-sm">รายจ่ายรวม</dt>
              <dd className="financial-figures font-bold">
                {formatThaiBaht(totals.totalExpenseSatang)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-muted-foreground text-sm">
                ภาษีหัก ณ ที่จ่าย
              </dt>
              <dd className="financial-figures font-bold">
                {formatThaiBaht(totals.totalWithholdingSatang)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="data-actions-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-secondary text-sm font-semibold">รายการ</p>
            <h2 className="mt-1 text-xl font-bold" id="data-actions-heading">
              เพิ่มหรือแก้ไขข้อมูล
            </h2>
          </div>
          <Link
            className="text-primary focus-visible:ring-focus/35 hidden min-h-11 items-center gap-2 rounded-lg text-sm font-semibold hover:underline focus-visible:ring-3 focus-visible:outline-none sm:inline-flex"
            href="/calculator/summary"
          >
            ดูสรุปทั้งหมด
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="border-border bg-card mt-4 divide-y overflow-hidden rounded-2xl border shadow-sm sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {sections.map(({ href, icon: Icon, title, description }, index) => (
            <Link
              className={`focus-visible:ring-focus/35 group hover:bg-muted/60 flex items-start gap-4 px-5 py-4 transition-colors focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-inset sm:px-6 sm:py-5 ${index > 1 ? "sm:border-border sm:border-t" : ""}`}
              href={href}
              key={href}
            >
              <span className="bg-muted text-primary grid size-10 shrink-0 place-items-center rounded-xl">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{title}</span>
                <span className="text-muted-foreground mt-1 block text-sm leading-5">
                  {description}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="text-muted-foreground mt-2 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>

        <Link
          className="border-border bg-card text-foreground focus-visible:ring-focus/35 hover:bg-muted mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm focus-visible:ring-3 focus-visible:outline-none sm:hidden"
          href="/calculator/summary"
        >
          <FileCheck2 aria-hidden="true" className="size-4" />
          ดูสรุปทั้งหมด
        </Link>
      </section>
    </>
  );
}
