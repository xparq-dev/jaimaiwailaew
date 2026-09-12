import { resolveTaxRules } from "@/tax/engine/taxRuleResolver";

import type {
  CalculatorAssumption,
  CalculatorCompleteness,
  CalculatorWarning,
  CalculatorWorkspace,
} from "./types";
import { hasEntriesOutsidePeriod } from "./arithmetic";
import { isEntryWithinPeriod } from "./utils";

export function buildCalculatorAssumptions(): CalculatorAssumption[] {
  return [
    {
      id: "arithmetic-only",
      message: "ยอดรวมเป็นผลรวมเชิงคณิตศาสตร์จากข้อมูลที่ผู้ใช้กรอกเท่านั้น",
    },
    {
      id: "no-tax-determination",
      message: "รายจ่ายและค่าลดหย่อนแบบร่างยังไม่ได้รับการวินิจฉัยทางภาษี",
    },
    {
      id: "verify-before-filing",
      message:
        "ผู้ใช้ต้องตรวจเอกสารและข้อมูลกับแหล่งทางการหรือผู้เชี่ยวชาญก่อนยื่นภาษี",
    },
    {
      id: "rules-unverified",
      message: "Tax Rule Set ที่เลือกยังไม่พร้อมใช้คำนวณภาษีประมาณการ",
    },
  ];
}

export function buildCalculatorWarnings(
  workspace: CalculatorWorkspace,
): CalculatorWarning[] {
  const warnings: CalculatorWarning[] = [];
  const incomeInPeriod = workspace.incomeEntries.filter((entry) =>
    isEntryWithinPeriod(entry, workspace.periodStart, workspace.periodEnd),
  );
  const expenseNeedsReview = workspace.expenseEntries.filter(
    (entry) =>
      entry.taxRelevanceStatus === "needs_review" ||
      entry.taxRelevanceStatus === "uncategorized",
  );
  const withholdingMissingReference = workspace.withholdingEntries.filter(
    (entry) => !entry.payerName && !entry.certificateReference,
  );
  const uniqueIncomeCategories = new Set(
    incomeInPeriod.map((entry) => entry.categoryCode),
  );

  if (incomeInPeriod.length === 0) {
    warnings.push({
      code: "no-income-in-period",
      message: "ยังไม่มีรายการรายรับในช่วงเวลาที่เลือก",
      severity: "warning",
    });
  }

  if (hasEntriesOutsidePeriod(workspace)) {
    warnings.push({
      code: "entries-outside-period",
      message:
        "มีรายการที่อยู่นอกช่วงเวลาที่เลือก จึงไม่ถูกรวมในยอดสรุปของช่วงนี้",
      severity: "warning",
    });
  }

  if (expenseNeedsReview.length > 0) {
    warnings.push({
      code: "expense-needs-review",
      message: `มีรายจ่าย ${expenseNeedsReview.length} รายการที่ควรตรวจสอบเพิ่มเติม`,
      severity: "warning",
    });
  }

  if (withholdingMissingReference.length > 0) {
    warnings.push({
      code: "withholding-missing-reference",
      message:
        "มีรายการภาษีหัก ณ ที่จ่ายที่ยังไม่มีชื่อผู้จ่ายหรือเลขอ้างอิงเอกสาร",
      severity: "warning",
    });
  }

  if (
    workspace.persona === "multiple_income" &&
    uniqueIncomeCategories.size <= 1 &&
    incomeInPeriod.length > 0
  ) {
    warnings.push({
      code: "single-income-category",
      message:
        "เลือกโหมดหลายรายได้ แต่ยังมีประเภทรายรับเพียงประเภทเดียว ควรตรวจสอบประเภทเงินได้และเอกสารประกอบ",
      severity: "warning",
    });
  }

  const reviewEntries = [
    ...workspace.expenseEntries.filter(
      (entry) => entry.taxRelevanceStatus === "needs_review",
    ),
    ...workspace.withholdingEntries.filter(
      (entry) => !entry.note && !entry.certificateReference,
    ),
  ];

  if (reviewEntries.length > 0) {
    warnings.push({
      code: "missing-review-notes",
      message:
        "มีรายการที่ควรตรวจสอบแต่ยังไม่มีหมายเหตุหรือข้อมูลอ้างอิงเพียงพอ",
      severity: "info",
    });
  }

  warnings.push({
    code: "local-only-data",
    message:
      "ข้อมูลอยู่ในอุปกรณ์นี้เท่านั้น การล้าง browser data อาจทำให้ข้อมูลหาย",
    severity: "info",
  });

  const resolution = resolveTaxRules({ taxYearBE: workspace.taxYearBE });
  if (resolution.featureGates.taxEstimate === "unavailable_until_verified") {
    warnings.push({
      code: "tax-estimate-unavailable",
      message: "กฎภาษียังไม่ผ่านการตรวจสอบ จึงไม่สามารถคำนวณภาษีประมาณการได้",
      severity: "warning",
    });
  }

  return warnings;
}

export function computeCompleteness(
  workspace: CalculatorWorkspace,
): CalculatorCompleteness {
  let score = 0;
  const maxScore = 5;

  const incomeInPeriod = workspace.incomeEntries.filter((entry) =>
    isEntryWithinPeriod(entry, workspace.periodStart, workspace.periodEnd),
  );

  if (incomeInPeriod.length > 0) {
    score += 1;
  }
  if (workspace.expenseEntries.length > 0) {
    score += 1;
  }
  if (workspace.withholdingEntries.length > 0) {
    score += 1;
  }
  if (workspace.allowanceDraftEntries.length > 0) {
    score += 1;
  }
  if (
    workspace.expenseEntries.every(
      (entry) => entry.taxRelevanceStatus !== "uncategorized",
    )
  ) {
    score += 1;
  }

  let statusLabel = "เริ่มต้น";
  let description = "ยังมีข้อมูลสำคัญที่ควรเพิ่มเพื่อช่วยสรุปข้อมูลในอุปกรณ์";

  if (score >= 4) {
    statusLabel = "ค่อนข้างครบ";
    description =
      "มีข้อมูลหลักครบหลายส่วนแล้ว แต่ยังต้องตรวจสอบรายละเอียดและเอกสารประกอบ";
  } else if (score >= 2) {
    statusLabel = "กำลังดำเนินการ";
    description = "มีข้อมูลบางส่วนแล้ว ควรเพิ่มรายการที่ยังขาด";
  }

  return {
    score,
    maxScore,
    statusLabel,
    description,
  };
}

export function isTaxEstimateAvailable(
  workspace: CalculatorWorkspace,
): boolean {
  const resolution = resolveTaxRules({ taxYearBE: workspace.taxYearBE });
  return resolution.featureGates.taxEstimate === "available";
}
