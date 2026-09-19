"use client";

import {
  Banknote,
  FileDown,
  Percent,
  ReceiptText,
  ScrollText,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { useCalculatorStore } from "@/calculator/store";
import { formatThaiBaht } from "@/tax/money";
import { computeArithmeticTotals } from "@/calculator/arithmetic";
import { getPersonaLabel } from "@/calculator/categories";
import { formatThaiDate } from "@/calculator/utils";
import { CalculatorLayout } from "./calculator-layout";
import { WorkspacePersonaEditor } from "./workspace-persona-editor";

const sections = [
  {
    href: "/calculator/income",
    icon: Banknote,
    title: "รายรับ",
    description: "บันทึกและจัดการรายการรายได้ทั้งหมด",
  },
  {
    href: "/calculator/expenses",
    icon: ReceiptText,
    title: "รายจ่าย",
    description: "บันทึกและจัดกลุ่มรายจ่ายที่เกี่ยวข้อง",
  },
  {
    href: "/calculator/withholding-tax",
    icon: Percent,
    title: "ภาษีหัก ณ ที่จ่าย",
    description: "บันทึกยอดภาษีตามเอกสารหัก ณ ที่จ่ายที่มี",
  },
  {
    href: "/calculator/allowances",
    icon: WalletCards,
    title: "ค่าลดหย่อน (แบบร่าง)",
    description: "บันทึกรายการลดหย่อนตามที่วางแผนไว้",
  },
  {
    href: "/calculator/summary",
    icon: ScrollText,
    title: "สรุปข้อมูล",
    description: "ดูยอดรวมเลขคณิต คำเตือน และสมมติฐาน",
  },
  {
    href: "/calculator/export-pdf",
    icon: FileDown,
    title: "รายงาน PDF (Phase 1C)",
    description: "จะเปิดใช้งานในเฟสถัดไปหลังผ่านการตรวจสอบ",
    disabled: true,
  },
] as const;

export function CalculatorOverview() {
  const workspace = useCalculatorStore((state) => state.workspace);

  return (
    <CalculatorLayout
      description="พื้นที่จัดการข้อมูลการเงินบนอุปกรณ์ของคุณแบบ Local-only เพื่อสรุปผลรวมเลขคณิต"
      title="ภาพรวมเครื่องคำนวณ"
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

  return (
    <>
      <section
        aria-label="ข้อมูล Workspace"
        className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            Workspace ปัจจุบัน
          </p>
          <h2 className="mt-1 text-lg font-bold">
            {getPersonaLabel(workspace.persona)} · ปีภาษี {workspace.taxYearBE}
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

      <section aria-label="สรุปเบื้องต้น" className="grid gap-3 sm:grid-cols-3">
        <div className="border-border bg-card rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs font-medium">รายรับรวม</p>
          <p className="text-primary mt-1 text-xl font-bold">
            {formatThaiBaht(totals.totalIncomeSatang)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {workspace.incomeEntries.length} รายการ
          </p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs font-medium">
            รายจ่ายรวม
          </p>
          <p className="text-foreground mt-1 text-xl font-bold">
            {formatThaiBaht(totals.totalExpenseSatang)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {workspace.expenseEntries.length} รายการ
          </p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs font-medium">
            ส่วนต่างก่อนภาษี
          </p>
          <p className="text-foreground mt-1 text-xl font-bold">
            {formatThaiBaht(totals.netBeforeTaxSatang)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">ส่วนต่างเลขคณิต</p>
        </div>
      </section>

      <section aria-label="ส่วนต่าง ๆ ของเครื่องคำนวณ">
        <h2 className="mb-3 text-lg font-bold">ส่วนจัดการข้อมูล</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ href, icon: Icon, title, description, ...rest }) => {
            const isDisabled = "disabled" in rest && rest.disabled;
            return (
              <Link
                aria-disabled={isDisabled ? "true" : undefined}
                className={`border-border bg-card focus-visible:ring-focus/35 flex min-h-24 items-start gap-4 rounded-2xl border p-5 shadow-sm transition focus-visible:ring-3 focus-visible:outline-none ${
                  isDisabled
                    ? "cursor-not-allowed opacity-60"
                    : "hover:border-focus/50 hover:bg-muted"
                }`}
                href={isDisabled ? "#" : href}
                key={href}
              >
                <span className="bg-muted text-primary grid size-10 shrink-0 place-items-center rounded-xl">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <span className="block font-semibold">{title}</span>
                  <span className="text-muted-foreground mt-1 block text-xs leading-5">
                    {description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
