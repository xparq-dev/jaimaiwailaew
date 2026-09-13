import type {
  AllowanceDraftCategoryCode,
  CalculatorPersona,
  ExpenseCategoryCode,
  ExpenseTaxRelevanceStatus,
  IncomeCategoryCode,
} from "./types";

export interface CategoryOption<T extends string = string> {
  readonly code: T;
  readonly label: string;
  readonly hint?: string | undefined;
}

export const PERSONA_OPTIONS: readonly CategoryOption<CalculatorPersona>[] = [
  {
    code: "online_seller_business",
    label: "ขายออนไลน์ / ธุรกิจ",
    hint: "เหมาะกับการจัดข้อมูลรายรับ-รายจ่ายจากการขายหรือธุรกิจ",
  },
  {
    code: "freelancer",
    label: "ฟรีแลนซ์",
    hint: "เหมาะกับรายได้จากงานบริการและลูกค้า",
  },
  {
    code: "salaried_employee",
    label: "พนักงานประจำ",
    hint: "เหมาะกับเงินเดือน โบนัส และภาษีหัก ณ ที่จ่าย",
  },
  {
    code: "multiple_income",
    label: "มีรายได้หลายทาง",
    hint: "เหมาะกับหลายแหล่งรายได้ที่ต้องแยกประเภท",
  },
  {
    code: "unsure",
    label: "ยังไม่แน่ใจ",
    hint: "ใช้คำถามสั้น ๆ เพื่อช่วยเลือกโหมดเริ่มต้น",
  },
];

export const INCOME_CATEGORY_OPTIONS: readonly CategoryOption<IncomeCategoryCode>[] =
  [
    { code: "salary", label: "เงินเดือน / ค่าจ้างประจำ" },
    { code: "bonus", label: "โบนัส / เงินพิเศษ" },
    { code: "online_sales", label: "ขายสินค้า / ขายออนไลน์" },
    { code: "freelance_service", label: "รับจ้าง / งานอิสระ / บริการ" },
    { code: "rental", label: "รายได้จากค่าเช่า" },
    { code: "other", label: "รายได้อื่น ๆ" },
  ];

export const EXPENSE_CATEGORY_OPTIONS: readonly CategoryOption<ExpenseCategoryCode>[] =
  [
    { code: "inventory", label: "สินค้าคงคลัง / ต้นทุนสินค้า" },
    { code: "shipping", label: "ค่าขนส่ง" },
    { code: "packaging", label: "ค่ากล่อง / บรรจุภัณฑ์" },
    { code: "platform_fee", label: "ค่าธรรมเนียมแพลตฟอร์ม" },
    { code: "advertising", label: "ค่าโฆษณา" },
    { code: "transport", label: "ค่าเดินทาง" },
    { code: "utilities", label: "ค่าสาธารณูปโภค" },
    { code: "supplies", label: "วัสดุสิ้นเปลือง" },
    { code: "other", label: "อื่น ๆ" },
  ];

export const EXPENSE_STATUS_OPTIONS: readonly CategoryOption<ExpenseTaxRelevanceStatus>[] =
  [
    {
      code: "likely_related",
      label: "น่าจะเกี่ยวข้องกับงาน",
      hint: "ใช้จัดกลุ่มเท่านั้น ไม่ใช่คำวินิจฉัยว่าหักได้",
    },
    {
      code: "needs_review",
      label: "ควรตรวจสอบเพิ่มเติม",
      hint: "ควรตรวจเอกสารและข้อมูลกับแหล่งทางการ",
    },
    {
      code: "personal",
      label: "ส่วนตัว",
      hint: "ใช้แยกรายการที่อาจไม่เกี่ยวกับงาน",
    },
    {
      code: "uncategorized",
      label: "ยังไม่จัดหมวด",
      hint: "ควรระบุรายละเอียดเพิ่มเติม",
    },
  ];

export const ALLOWANCE_DRAFT_CATEGORY_OPTIONS: readonly CategoryOption<AllowanceDraftCategoryCode>[] =
  [
    { code: "personal_draft", label: "ค่าลดหย่อนส่วนตัว (ร่าง)" },
    { code: "family_draft", label: "ค่าลดหย่อนครอบครัว (ร่าง)" },
    { code: "insurance_draft", label: "ประกัน (ร่าง)" },
    {
      code: "savings_investment_draft",
      label: "ออม/ลงทุน (ร่าง)",
    },
    { code: "donation_draft", label: "บริจาค (ร่าง)" },
    { code: "other", label: "อื่น ๆ (ร่าง)" },
  ];

export const INCOME_CATEGORY_DISCLAIMER =
  "หมวดบันทึกนี้ใช้เพื่อจัดระเบียบข้อมูลส่วนตัวเท่านั้น ไม่ใช่การจัดประเภทเงินได้หรือคำวินิจฉัยภาษีตามกฎหมาย";

export const EXPENSE_CATEGORY_DISCLAIMER =
  "สถานะการจัดกลุ่มรายการเป็นเพียงเครื่องช่วยทบทวนข้อมูล ไม่ได้ยืนยันว่ารายจ่ายรายการใดหักภาษีได้";

export const CATEGORY_DISCLAIMER = INCOME_CATEGORY_DISCLAIMER;

export function getIncomeCategoryLabel(code: IncomeCategoryCode): string {
  return (
    INCOME_CATEGORY_OPTIONS.find((option) => option.code === code)?.label ??
    code
  );
}

export function getExpenseCategoryLabel(code: ExpenseCategoryCode): string {
  return (
    EXPENSE_CATEGORY_OPTIONS.find((option) => option.code === code)?.label ??
    code
  );
}

export function getExpenseStatusLabel(code: ExpenseTaxRelevanceStatus): string {
  return (
    EXPENSE_STATUS_OPTIONS.find((option) => option.code === code)?.label ?? code
  );
}

export function getAllowanceCategoryLabel(
  code: AllowanceDraftCategoryCode,
): string {
  return (
    ALLOWANCE_DRAFT_CATEGORY_OPTIONS.find((option) => option.code === code)
      ?.label ?? code
  );
}

export function getPersonaLabel(persona: CalculatorPersona): string {
  return (
    PERSONA_OPTIONS.find((option) => option.code === persona)?.label ?? persona
  );
}

export function getCalculationModeLabel(mode: string): string {
  switch (mode) {
    case "pnd94":
      return "ภ.ง.ด.94 (เตรียมข้อมูลครึ่งปี)";
    case "pnd91":
      return "ภ.ง.ด.91 (เตรียมข้อมูลประจำปี)";
    case "annual_estimate":
      return "สรุปข้อมูลทั้งปี";
    case "multi_income_estimate":
      return "หลายแหล่งรายได้";
    default:
      return mode;
  }
}
