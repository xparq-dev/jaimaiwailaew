"use client";

import { CheckCircle2, Info } from "lucide-react";

import type { CalculatorWorkspace } from "@/calculator/types";
import { calculateWorkspaceSocialSecurity } from "@/calculator/social-security";
import { calculateWorkspacePIT } from "@/tax/engine/workspacePitAdapter";
import { formatThaiBaht, toMoneySatang } from "@/tax/money";

interface TaxEstimateCardProps {
  readonly workspace: CalculatorWorkspace;
}

export function TaxEstimateCard({ workspace }: TaxEstimateCardProps) {
  const result = calculateWorkspacePIT(workspace);
  const socialSecurity = calculateWorkspaceSocialSecurity(workspace);

  return (
    <section
      aria-labelledby="tax-estimate-title"
      className="border-border bg-card rounded-2xl border p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CheckCircle2
            aria-hidden="true"
            className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <h2 className="text-lg font-bold" id="tax-estimate-title">
            ประมาณการภาษีเงินได้บุคคลธรรมดา
          </h2>
        </div>
        <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          กฎภาษีปี {workspace.taxYearBE} ผ่านการตรวจสอบแล้ว (v1.0.0)
        </span>
      </div>

      <p className="text-muted-foreground mt-2 text-sm leading-6">
        คำนวณจากรายได้ ค่าใช้จ่ายตามสัดส่วนกฎหมาย ค่าลดหย่อน และภาษีหัก ณ
        ที่จ่ายตามรอบระยะเวลาที่เลือก
      </p>

      {/* Outcome Highlight Banner */}
      <div className="mt-5">
        {result.outcome === "refund" ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              ประมาณการภาษีที่ขอคืนได้ (Refund)
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-300">
              {formatThaiBaht(
                toMoneySatang(Math.abs(result.taxDueOrRefundSatang)),
              )}
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-800/80 dark:text-emerald-200/80">
              คุณได้ชำระภาษีหัก ณ
              ที่จ่ายไว้มากกว่าภาษีที่คำนวณได้ตามอัตราก้าวหน้า
            </p>
          </div>
        ) : result.outcome === "pay" ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              ประมาณการภาษีที่ต้องชำระเพิ่ม (Tax Due)
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-amber-700 dark:text-amber-300">
              {formatThaiBaht(result.taxDueOrRefundSatang)}
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-200/80">
              ภาษีที่คำนวณได้ตามอัตราก้าวหน้าสูงกว่าภาษีหัก ณ
              ที่จ่ายที่บันทึกไว้
            </p>
          </div>
        ) : (
          <div className="border-border bg-muted/40 rounded-2xl border p-5">
            <p className="text-foreground text-sm font-medium">
              ไม่มีภาษีที่ต้องชำระเพิ่ม หรือขอคืน
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">
              0.00 บาท
            </p>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              เงินได้สุทธิอยู่ในเกณฑ์ได้รับการยกเว้นภาษี หรือยอดหัก ณ
              ที่จ่ายเท่ากับภาษีที่ต้องชำระ
            </p>
          </div>
        )}
      </div>

      {/* Step-by-step breakdown list */}
      <dl className="border-border mt-5 divide-y divide-dashed border-t text-sm">
        <div className="flex justify-between py-3">
          <dt className="text-muted-foreground">เงินได้พึงประเมินรวม</dt>
          <dd className="font-semibold">
            {formatThaiBaht(result.grossIncomeSatang)}
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-muted-foreground">
            หัก ค่าใช้จ่ายตามกฎหมาย (เหมา/จริง)
          </dt>
          <dd className="text-muted-foreground">
            - {formatThaiBaht(result.expenseDeductionSatang)}
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-muted-foreground">เงินได้หลังหักค่าใช้จ่าย</dt>
          <dd className="font-medium">
            {formatThaiBaht(result.incomeAfterExpensesSatang)}
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-muted-foreground">
            ในค่าลดหย่อน: เงินสมทบประกันสังคม
          </dt>
          <dd className="text-muted-foreground">
            - {formatThaiBaht(socialSecurity.contributionSatang)}
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-muted-foreground">หัก ค่าลดหย่อนรวม</dt>
          <dd className="text-muted-foreground">
            - {formatThaiBaht(result.totalAllowancesSatang)}
          </dd>
        </div>
        <div className="flex justify-between py-3 font-semibold">
          <dt>เงินได้สุทธิเพื่อคำนวณภาษี (Net Taxable Income)</dt>
          <dd className="text-primary text-base">
            {formatThaiBaht(result.netTaxableIncomeSatang)}
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-muted-foreground">
            ภาษีคำนวณตามอัตราขั้นบันได (Gross Tax)
          </dt>
          <dd className="font-medium">
            {formatThaiBaht(result.grossTaxSatang)}
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-muted-foreground">
            หัก ภาษีหัก ณ ที่จ่ายที่ชำระไว้
          </dt>
          <dd className="text-muted-foreground">
            - {formatThaiBaht(result.withholdingTaxPaidSatang)}
          </dd>
        </div>
      </dl>

      {/* Brackets applied details */}
      {result.bracketApplications.length > 0 ? (
        <div className="border-border bg-muted/30 mt-4 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            การคำนวณภาษีตามขั้นบันได (Tax Brackets)
          </p>
          <ul className="mt-2 space-y-1.5 text-xs">
            {result.bracketApplications.map((b) => (
              <li key={b.level} className="flex justify-between">
                <span>
                  ขั้นที่ {b.level} (อัตรา {b.ratePercent}%) เงินได้สุทธิ{" "}
                  {formatThaiBaht(b.taxableInBracketSatang)}
                </span>
                <span className="font-mono">
                  {formatThaiBaht(b.taxInBracketSatang)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Legal Disclaimers */}
      <div className="border-border bg-muted/20 text-muted-foreground mt-5 rounded-xl border p-4 text-xs leading-5">
        <div className="flex items-start gap-2">
          <Info
            aria-hidden="true"
            className="text-muted-foreground mt-0.5 size-4 shrink-0"
          />
          <div className="space-y-1">
            <p className="text-foreground font-semibold">
              ข้อกำหนดและข้อจำกัดความรับผิดชอบ:
            </p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>เอกสารนี้สร้างขึ้นเพื่อการจัดระเบียบข้อมูลส่วนตัวเท่านั้น</li>
              <li>การคำนวณภาษีเป็นเพียงประมาณการเบื้องต้น</li>
              <li>โปรดปรึกษาผู้เชี่ยวชาญหรือกรมสรรพากรก่อนยื่นภาษีจริง</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
