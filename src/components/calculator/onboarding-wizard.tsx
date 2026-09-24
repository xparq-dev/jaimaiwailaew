"use client";

import {
  BriefcaseBusiness,
  CheckCircle2,
  CircleHelp,
  Layers3,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/auth/auth-provider";
import { PERSONA_OPTIONS } from "@/calculator/categories";
import { useCalculatorStore } from "@/calculator/store";
import type { CalculatorPersona } from "@/calculator/types";
import { taxYearPeriodDefaults } from "@/calculator/utils";
import { getDefaultWorkspaceInput } from "@/calculator/workspace";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

interface OnboardingWizardProps {
  readonly initialFlow?:
    "income-type" | "pnd94" | "pnd91" | "multi-income" | undefined;
}

const personaIcons: Record<CalculatorPersona, typeof ShoppingBag> = {
  online_seller_business: ShoppingBag,
  freelancer: BriefcaseBusiness,
  salaried_employee: UserRound,
  multiple_income: Layers3,
  unsure: CircleHelp,
};

export function OnboardingWizard({
  initialFlow = "income-type",
}: OnboardingWizardProps) {
  const router = useRouter();
  const workspace = useCalculatorStore((state) => state.workspace);
  const createAdditionalWorkspace = useCalculatorStore(
    (state) => state.createAdditionalWorkspace,
  );
  const initializeWorkspace = useCalculatorStore(
    (state) => state.initializeWorkspace,
  );
  const { user } = useAuth();

  const getInitialPersona = (): CalculatorPersona => {
    switch (initialFlow) {
      case "pnd94":
        return "online_seller_business";
      case "pnd91":
        return "salaried_employee";
      case "multi-income":
        return "multiple_income";
      default:
        return "online_seller_business";
    }
  };

  const [persona, setPersona] = useState<CalculatorPersona>(getInitialPersona);
  const [taxYearBE, setTaxYearBE] = useState<2568 | 2569>(2569);
  const [periodChoice, setPeriodChoice] = useState<"first_half" | "full_year">(
    initialFlow === "pnd91" ? "full_year" : "first_half",
  );
  const [unsureAnswer, setUnsureAnswer] = useState<string>("");
  const [confirmReplace, setConfirmReplace] = useState(false);

  const periods = taxYearPeriodDefaults(taxYearBE);

  const handleStart = () => {
    const input = getDefaultWorkspaceInput(persona, taxYearBE, periodChoice);
    if (workspace && user) {
      createAdditionalWorkspace(input);
      router.push("/calculator");
      return;
    }
    if (workspace && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }

    initializeWorkspace(input, true);
    router.push("/calculator");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        description={
          user
            ? "เลือกรูปแบบเพื่อสร้าง Workspace เพิ่ม ข้อมูลจะบันทึกในอุปกรณ์ก่อนและส่งสำเนาเมื่อคุณเปิด Cloud Sync"
            : "เลือกรูปแบบเพื่อตั้งค่าพื้นที่จัดระเบียบข้อมูลเบื้องต้น ข้อมูลทั้งหมดจะบันทึกในอุปกรณ์นี้เท่านั้นและไม่ส่งขึ้นเครือข่าย"
        }
        eyebrow="เริ่มต้นใช้งาน"
        title="ตั้งค่าเครื่องคำนวณ"
      />

      {workspace && confirmReplace ? (
        <div
          aria-live="assertive"
          className="border-warning/30 bg-warning-soft text-warning-strong space-y-3 rounded-2xl border p-5"
          role="alert"
        >
          <p className="font-semibold">
            มีข้อมูล Workspace เดิมอยู่ในอุปกรณ์นี้แล้ว
          </p>
          <p className="text-sm leading-6">
            หากคุณสร้าง Workspace ใหม่ ข้อมูลรายรับ รายจ่าย ภาษีหัก ณ ที่จ่าย
            และค่าลดหย่อนเดิมจะถูกแทนที่ คุณต้องการดำเนินการต่อหรือไม่?
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                const input = getDefaultWorkspaceInput(
                  persona,
                  taxYearBE,
                  periodChoice,
                );
                initializeWorkspace(input, true);
                router.push("/calculator");
              }}
              variant="danger"
            >
              ยืนยันสร้างใหม่ (แทนที่ข้อมูลเดิม)
            </Button>
            <Button
              onClick={() => setConfirmReplace(false)}
              variant="secondary"
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      ) : null}

      {/* Step 1: Select Persona */}
      <section aria-labelledby="persona-section-title" className="space-y-4">
        <div>
          <h2 className="text-lg font-bold" id="persona-section-title">
            1. ลักษณะรายได้ของคุณ
          </h2>
          <p className="text-muted-foreground text-sm">
            เลือกรูปแบบที่ตรงกับการทำงานมากที่สุด (สามารถเปลี่ยนภายหลังได้)
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PERSONA_OPTIONS.map((option) => {
            const isSelected = persona === option.code;
            const Icon = personaIcons[option.code];
            return (
              <button
                aria-pressed={isSelected}
                className={`focus-visible:ring-focus/35 flex gap-4 rounded-2xl border p-5 text-left transition focus-visible:ring-3 focus-visible:outline-none ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-primary/30 shadow-sm ring-1"
                    : "border-border bg-card hover:border-focus/50 hover:bg-muted"
                }`}
                key={option.code}
                onClick={() => {
                  setPersona(option.code);
                  if (option.code === "salaried_employee") {
                    setPeriodChoice("full_year");
                  } else if (option.code === "online_seller_business") {
                    setPeriodChoice("first_half");
                  }
                }}
                type="button"
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-primary"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{option.label}</p>
                    {isSelected ? (
                      <CheckCircle2
                        aria-hidden="true"
                        className="text-primary size-4"
                      />
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs leading-5">
                    {option.hint}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Unsure helper questions */}
      {persona === "unsure" ? (
        <section
          aria-labelledby="unsure-help-title"
          className="border-border bg-card space-y-4 rounded-2xl border p-5"
        >
          <h3 className="font-semibold" id="unsure-help-title">
            คำถามช่วยเลือกเบื้องต้น (ไม่บันทึกขึ้นเครือข่าย)
          </h3>
          <p className="text-muted-foreground text-sm leading-6">
            คุณมีรายรับหลักจากลักษณะใด?
          </p>
          <div className="space-y-2">
            {[
              {
                id: "salary-only",
                label: "มีเฉพาะเงินเดือนหรือค่าจ้างประจำ",
                recommendation: "อาจเหมาะสมกับ โหมดพนักงานประจำ (ภ.ง.ด.91)",
                targetPersona: "salaried_employee" as CalculatorPersona,
                targetPeriod: "full_year" as const,
              },
              {
                id: "commerce-service",
                label: "ขายของออนไลน์ งานฟรีแลนซ์ รับจ้าง หรือเปิดร้าน",
                recommendation:
                  "อาจเหมาะสมกับ โหมดขายออนไลน์/ธุรกิจ (ภ.ง.ด.94 ช่วงครึ่งปี)",
                targetPersona: "online_seller_business" as CalculatorPersona,
                targetPeriod: "first_half" as const,
              },
              {
                id: "both-multiple",
                label: "มีเงินเดือนด้วย และมีรายได้เสริมอื่น ๆ ด้วย",
                recommendation: "อาจเหมาะสมกับ โหมดหลายประเภทรายได้",
                targetPersona: "multiple_income" as CalculatorPersona,
                targetPeriod: "first_half" as const,
              },
            ].map((item) => (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition ${
                  unsureAnswer === item.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
                key={item.id}
              >
                <input
                  checked={unsureAnswer === item.id}
                  className="mt-1"
                  name="unsure-choice"
                  onChange={() => {
                    setUnsureAnswer(item.id);
                    setPersona(item.targetPersona);
                    setPeriodChoice(item.targetPeriod);
                  }}
                  type="radio"
                />
                <div>
                  <span className="font-medium">{item.label}</span>
                  <p className="text-muted-foreground mt-1 text-xs">
                    คำแนะนำ: {item.recommendation}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <p className="text-muted-foreground text-xs leading-5">
            * คำแนะนำนี้เป็นเพียงแนวทางเบื้องต้น
            ไม่ใช่คำปรึกษาทางกฎหมายหรือภาษีเฉพาะบุคคล
          </p>
        </section>
      ) : null}

      {/* Step 2: Select Tax Year */}
      <section aria-labelledby="tax-year-title" className="space-y-4">
        <div>
          <h2 className="text-lg font-bold" id="tax-year-title">
            2. ปีภาษี
          </h2>
          <p className="text-muted-foreground text-sm">
            เลือกปีภาษีที่ต้องการรวบรวมข้อมูล
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {[2569, 2568].map((year) => {
            const isSelected = taxYearBE === year;
            return (
              <button
                aria-pressed={isSelected}
                className={`focus-visible:ring-focus/35 min-w-36 rounded-2xl border p-4 text-center transition focus-visible:ring-3 focus-visible:outline-none ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-primary/30 ring-1"
                    : "border-border bg-card hover:border-focus/50 hover:bg-muted"
                }`}
                key={year}
                onClick={() => setTaxYearBE(year as 2568 | 2569)}
                type="button"
              >
                <p className="text-xl font-bold">พ.ศ. {year}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  (ค.ศ. {year - 543})
                </p>
              </button>
            );
          })}
        </div>
        <p className="text-warning-strong text-xs">
          หมายเหตุ: กฎภาษีสำหรับปี 2568 และ 2569 ยังอยู่ระหว่างการตรวจสอบ
          ระบบจะสรุปเฉพาะยอดรวมเลขคณิตเท่านั้น
        </p>
      </section>

      {/* Step 3: Select Period */}
      <section aria-labelledby="period-title" className="space-y-4">
        <div>
          <h2 className="text-lg font-bold" id="period-title">
            3. ช่วงเวลาของข้อมูล
          </h2>
          <p className="text-muted-foreground text-sm">
            เลือกช่วงเวลาที่ต้องการรวบรวมรายการ
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            aria-pressed={periodChoice === "first_half"}
            className={`focus-visible:ring-focus/35 flex gap-3 rounded-2xl border p-4 text-left transition focus-visible:ring-3 focus-visible:outline-none ${
              periodChoice === "first_half"
                ? "border-primary bg-primary/5 ring-primary/30 ring-1"
                : "border-border bg-card hover:border-focus/50 hover:bg-muted"
            }`}
            onClick={() => setPeriodChoice("first_half")}
            type="button"
          >
            <div className="space-y-1">
              <p className="font-semibold">ครึ่งปีแรก (1 ม.ค. – 30 มิ.ย.)</p>
              <p className="text-muted-foreground text-xs leading-5">
                เหมาะกับการเตรียมข้อมูลสำหรับ ภ.ง.ด.94 หรือประเมินกลางปี
              </p>
              <p className="text-primary font-mono text-xs">
                {periods.firstHalfStart} ถึง {periods.firstHalfEnd}
              </p>
            </div>
          </button>

          <button
            aria-pressed={periodChoice === "full_year"}
            className={`focus-visible:ring-focus/35 flex gap-3 rounded-2xl border p-4 text-left transition focus-visible:ring-3 focus-visible:outline-none ${
              periodChoice === "full_year"
                ? "border-primary bg-primary/5 ring-primary/30 ring-1"
                : "border-border bg-card hover:border-focus/50 hover:bg-muted"
            }`}
            onClick={() => setPeriodChoice("full_year")}
            type="button"
          >
            <div className="space-y-1">
              <p className="font-semibold">ตลอดทั้งปี (1 ม.ค. – 31 ธ.ค.)</p>
              <p className="text-muted-foreground text-xs leading-5">
                เหมาะกับเงินเดือนประจำปี หรือการสรุปภาพรวมทั้งปี
              </p>
              <p className="text-primary font-mono text-xs">
                {periods.fullYearStart} ถึง {periods.fullYearEnd}
              </p>
            </div>
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4 pt-4">
        <Button onClick={handleStart} size="default" type="button">
          สร้าง Workspace และเริ่มบันทึกข้อมูล
        </Button>
        <p className="text-muted-foreground text-xs">
          ข้อมูลจะถูกจัดเก็บบนอุปกรณ์นี้เท่านั้น
        </p>
      </div>
    </div>
  );
}
