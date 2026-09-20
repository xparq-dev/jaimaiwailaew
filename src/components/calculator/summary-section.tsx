"use client";

import Link from "next/link";
import { useState } from "react";

import {
  computeArithmeticTotals,
  computeMonthlyBreakdown,
} from "@/calculator/arithmetic";
import {
  getCalculationModeLabel,
  getPersonaLabel,
} from "@/calculator/categories";
import { useCalculatorStore } from "@/calculator/store";
import {
  buildCalculatorAssumptions,
  buildCalculatorWarnings,
  computeCompleteness,
} from "@/calculator/warnings";
import { formatThaiBaht } from "@/tax/money";
import { formatThaiDate } from "@/calculator/utils";
import { Button } from "@/components/ui/button";

import { CalculatorLayout } from "./calculator-layout";
import { ClearDataDialog } from "./clear-data-dialog";
import { TaxEstimateUnavailableCard } from "./tax-estimate-unavailable-card";
import { SummaryBreakdown } from "./summary-breakdown";
import { PdfExportPanel } from "./pdf-export-panel";

export function SummarySectionPage() {
  const workspace = useCalculatorStore((state) => state.workspace);
  const clearLocalData = useCalculatorStore((state) => state.clearLocalData);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  if (!workspace) {
    return null;
  }

  const totals = computeArithmeticTotals(workspace);
  const monthlyRows = computeMonthlyBreakdown(workspace);
  const warnings = buildCalculatorWarnings(workspace);
  const assumptions = buildCalculatorAssumptions();
  const completeness = computeCompleteness(workspace);

  return (
    <CalculatorLayout
      description="สรุปยอดรวมเชิงคณิตศาสตร์ คำเตือน และสถานะกฎภาษีจากข้อมูลในอุปกรณ์"
      title="สรุปข้อมูล"
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="ปีภาษี" value={`${workspace.taxYearBE}`} />
        <SummaryCard
          label="ประเภทผู้ใช้งาน"
          value={getPersonaLabel(workspace.persona)}
        />
        <SummaryCard
          label="โหมด"
          value={getCalculationModeLabel(workspace.calculationMode)}
        />
        <SummaryCard
          label="ช่วงเวลา"
          value={`${formatThaiDate(workspace.periodStart)} – ${formatThaiDate(workspace.periodEnd)}`}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="รายรับรวม"
          value={formatThaiBaht(totals.totalIncomeSatang)}
        />
        <SummaryCard
          label="รายจ่ายรวม"
          value={formatThaiBaht(totals.totalExpenseSatang)}
        />
        <SummaryCard
          label="ส่วนต่างก่อนภาษี"
          hint="เป็นส่วนต่างเชิงคณิตศาสตร์จากข้อมูลที่กรอก ไม่ใช่เงินได้สุทธิทางภาษี"
          value={formatThaiBaht(totals.netBeforeTaxSatang)}
        />
        <SummaryCard
          label="ภาษีหัก ณ ที่จ่ายที่บันทึกไว้"
          value={formatThaiBaht(totals.totalWithholdingSatang)}
        />
        <SummaryCard
          label="ค่าลดหย่อนที่บันทึกแบบร่าง"
          value={formatThaiBaht(totals.totalDeclaredAllowanceSatang)}
        />
      </section>

      <SummaryBreakdown workspace={workspace} />

      <PdfExportPanel workspace={workspace} />

      <TaxEstimateUnavailableCard />

      <section className="border-border bg-card rounded-2xl border p-5">
        <h2 className="font-semibold">ความครบถ้วนของข้อมูล</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {completeness.statusLabel} ({completeness.score}/
          {completeness.maxScore})
        </p>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          {completeness.description}
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <MessageList
          items={warnings.map((item) => item.message)}
          title="คำเตือน"
        />
        <MessageList
          items={assumptions.map((item) => item.message)}
          title="สมมติฐาน"
        />
      </section>

      <section className="border-border bg-card rounded-2xl border p-5">
        <h2 className="font-semibold">สรุปรายเดือน (เลขคณิต)</h2>
        {monthlyRows.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">
            ยังไม่มีรายการในช่วงเวลาที่เลือก
          </p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto lg:block">
              <table className="border-border w-full min-w-[640px] border-separate border-spacing-0 overflow-hidden rounded-xl border text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-3 text-left">เดือน</th>
                    <th className="px-4 py-3 text-right">รายรับ</th>
                    <th className="px-4 py-3 text-right">รายจ่าย</th>
                    <th className="px-4 py-3 text-right">ส่วนต่าง</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRows.map((row) => (
                    <tr className="border-border border-t" key={row.monthKey}>
                      <td className="px-4 py-3">{row.label}</td>
                      <td className="px-4 py-3 text-right">
                        {formatThaiBaht(row.incomeSatang)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatThaiBaht(row.expenseSatang)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatThaiBaht(row.netSatang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-4 space-y-3 lg:hidden">
              {monthlyRows.map((row) => (
                <li
                  className="border-border bg-background rounded-xl border p-4 text-sm"
                  key={row.monthKey}
                >
                  <p className="font-medium">{row.label}</p>
                  <dl className="mt-2 grid gap-1">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">รายรับ</dt>
                      <dd>{formatThaiBaht(row.incomeSatang)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">รายจ่าย</dt>
                      <dd>{formatThaiBaht(row.expenseSatang)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">ส่วนต่าง</dt>
                      <dd>{formatThaiBaht(row.netSatang)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/calculator/income">แก้ไขรายรับ</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/calculator/expenses">แก้ไขรายจ่าย</Link>
        </Button>
        <Button
          onClick={() => setClearDialogOpen(true)}
          type="button"
          variant="danger"
        >
          ล้างข้อมูลในอุปกรณ์นี้
        </Button>
      </div>

      <ClearDataDialog
        onConfirm={() => clearLocalData()}
        onOpenChange={setClearDialogOpen}
        open={clearDialogOpen}
      />
    </CalculatorLayout>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <article className="border-border bg-card rounded-2xl border p-5 shadow-sm">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {hint ? (
        <p className="text-muted-foreground mt-2 text-xs leading-5">{hint}</p>
      ) : null}
    </article>
  );
}

function MessageList({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <section className="border-border bg-card rounded-2xl border p-5">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span aria-hidden="true">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
