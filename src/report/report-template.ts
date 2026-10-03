export type ReportTemplateId = "full" | "summary" | "transactions";

export interface ReportTemplateSections {
  readonly breakdown: boolean;
  readonly income: boolean;
  readonly expense: boolean;
  readonly withholding: boolean;
  readonly deductions: boolean;
  readonly taxEstimate: boolean;
}

export interface ReportTemplateOption {
  readonly id: ReportTemplateId;
  readonly label: string;
  readonly description: string;
  readonly sections: ReportTemplateSections;
}

export const REPORT_TEMPLATE_OPTIONS: readonly ReportTemplateOption[] = [
  {
    id: "full",
    label: "ฉบับเต็ม",
    description: "ยอดสรุป รายการทั้งหมด Breakdown ค่าลดหย่อน และประมาณการภาษี",
    sections: {
      breakdown: true,
      income: true,
      expense: true,
      withholding: true,
      deductions: true,
      taxEstimate: true,
    },
  },
  {
    id: "summary",
    label: "สรุปยอด",
    description: "ยอดรวมและ Breakdown สำหรับดูภาพรวม โดยไม่แสดงรายการรายตัว",
    sections: {
      breakdown: true,
      income: false,
      expense: false,
      withholding: false,
      deductions: false,
      taxEstimate: false,
    },
  },
  {
    id: "transactions",
    label: "รายการเคลื่อนไหว",
    description: "ยอดรวมและรายการรายรับ รายจ่าย และภาษีหัก ณ ที่จ่าย",
    sections: {
      breakdown: false,
      income: true,
      expense: true,
      withholding: true,
      deductions: false,
      taxEstimate: false,
    },
  },
];

export function getReportTemplate(id: ReportTemplateId): ReportTemplateOption {
  return (
    REPORT_TEMPLATE_OPTIONS.find((template) => template.id === id) ??
    REPORT_TEMPLATE_OPTIONS[0]!
  );
}
