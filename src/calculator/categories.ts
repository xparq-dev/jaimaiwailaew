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
  readonly group?: string | undefined;
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
    {
      code: "salary",
      label: "เงินเดือน / ค่าจ้างประจำ",
      group: "งานประจำและค่าตอบแทน",
    },
    {
      code: "bonus",
      label: "โบนัส / เงินพิเศษ",
      group: "งานประจำและค่าตอบแทน",
    },
    {
      code: "overtime",
      label: "ค่าล่วงเวลา / เบี้ยเลี้ยง",
      group: "งานประจำและค่าตอบแทน",
    },
    {
      code: "commission",
      label: "ค่าคอมมิชชั่น / ค่านายหน้า",
      group: "งานประจำและค่าตอบแทน",
    },
    {
      code: "online_sales",
      label: "ขายสินค้า / ขายออนไลน์",
      group: "การขายและธุรกิจ",
    },
    {
      code: "store_sales",
      label: "ขายสินค้า / หน้าร้าน / ตลาดนัด",
      group: "การขายและธุรกิจ",
    },
    {
      code: "business_income",
      label: "ธุรกิจ / กิจการส่วนตัว",
      group: "การขายและธุรกิจ",
    },
    {
      code: "freelance_service",
      label: "รับจ้าง / งานอิสระ / บริการ",
      group: "งานบริการและสื่อ",
    },
    {
      code: "professional_service",
      label: "วิชาชีพอิสระ / ที่ปรึกษา",
      group: "งานบริการและสื่อ",
    },
    {
      code: "creator_affiliate",
      label: "คอนเทนต์ / โฆษณา / Affiliate",
      group: "งานบริการและสื่อ",
    },
    {
      code: "rental",
      label: "ค่าเช่า / ให้เช่าทรัพย์สิน",
      group: "ทรัพย์สินและการลงทุน",
    },
    {
      code: "interest",
      label: "ดอกเบี้ย / ผลตอบแทนเงินฝาก",
      group: "ทรัพย์สินและการลงทุน",
    },
    {
      code: "dividend",
      label: "เงินปันผล / ส่วนแบ่งกำไร",
      group: "ทรัพย์สินและการลงทุน",
    },
    {
      code: "investment",
      label: "ลงทุน / ซื้อขายสินทรัพย์",
      group: "ทรัพย์สินและการลงทุน",
    },
    {
      code: "royalty",
      label: "ลิขสิทธิ์ / ค่าสิทธิ",
      group: "ทรัพย์สินและการลงทุน",
    },
    {
      code: "agriculture",
      label: "เกษตร / ปศุสัตว์ / ประมง",
      group: "เกษตร เกษียณ และอื่น ๆ",
    },
    {
      code: "pension",
      label: "บำนาญ / เงินเกษียณ",
      group: "เกษตร เกษียณ และอื่น ๆ",
    },
    {
      code: "prize_grant",
      label: "เงินรางวัล / เงินสนับสนุน",
      group: "เกษตร เกษียณ และอื่น ๆ",
    },
    {
      code: "other",
      label: "รายได้อื่น ๆ",
      group: "เกษตร เกษียณ และอื่น ๆ",
    },
  ];

export const INCOME_CATEGORY_GROUPS = [
  "งานประจำและค่าตอบแทน",
  "การขายและธุรกิจ",
  "งานบริการและสื่อ",
  "ทรัพย์สินและการลงทุน",
  "เกษตร เกษียณ และอื่น ๆ",
] as const;

export const INCOME_SOURCE_SUGGESTIONS: Readonly<
  Record<IncomeCategoryCode, readonly string[]>
> = {
  salary: ["เงินเดือน / ค่าจ้างประจำ", "นายจ้าง / บริษัท"],
  bonus: ["โบนัส / เงินพิเศษ", "นายจ้าง / บริษัท"],
  overtime: ["ค่าล่วงเวลา / เบี้ยเลี้ยง", "นายจ้าง / บริษัท"],
  commission: [
    "ค่าคอมมิชชั่น / ค่านายหน้า",
    "นายจ้าง / บริษัท",
    "ลูกค้าโดยตรง",
    "แพลตฟอร์มตัวแทนขาย",
  ],
  online_sales: [
    "ขายสินค้า / ขายออนไลน์",
    "Shopee",
    "Lazada",
    "TikTok Shop",
    "Facebook / Instagram",
    "เว็บไซต์ / หน้าร้าน",
  ],
  store_sales: [
    "ขายสินค้า / หน้าร้าน / ตลาดนัด",
    "หน้าร้าน",
    "ตลาดนัด / งานอีเวนต์",
    "ลูกค้าโดยตรง",
  ],
  business_income: [
    "ธุรกิจ / กิจการส่วนตัว",
    "กิจการของตนเอง",
    "ลูกค้าธุรกิจ",
    "หน้าร้าน / สาขา",
  ],
  freelance_service: [
    "รับจ้าง / งานอิสระ / บริการ",
    "ลูกค้าโดยตรง",
    "บริษัท / ผู้ว่าจ้าง",
    "แพลตฟอร์มฟรีแลนซ์",
  ],
  professional_service: [
    "วิชาชีพอิสระ / ที่ปรึกษา",
    "ลูกค้าโดยตรง",
    "บริษัท / ผู้ว่าจ้าง",
    "สำนักงาน / คลินิก",
  ],
  creator_affiliate: [
    "คอนเทนต์ / โฆษณา / Affiliate",
    "YouTube",
    "TikTok",
    "Facebook / Instagram",
    "แพลตฟอร์ม Affiliate",
    "ผู้สนับสนุน / สปอนเซอร์",
  ],
  rental: ["ค่าเช่า / ให้เช่าทรัพย์สิน", "ผู้เช่า", "แพลตฟอร์มให้เช่า"],
  interest: ["ดอกเบี้ย / ผลตอบแทนเงินฝาก", "ธนาคาร", "สหกรณ์", "ผู้ออกตราสาร"],
  dividend: [
    "เงินปันผล / ส่วนแบ่งกำไร",
    "บริษัท",
    "กองทุน",
    "ห้างหุ้นส่วน / กิจการ",
  ],
  investment: [
    "ลงทุน / ซื้อขายสินทรัพย์",
    "บริษัทหลักทรัพย์",
    "แพลตฟอร์มลงทุน",
    "ตลาดหลักทรัพย์ / กองทุน",
    "สินทรัพย์ดิจิทัล",
    "ผู้ซื้อสินทรัพย์",
  ],
  royalty: [
    "ลิขสิทธิ์ / ค่าสิทธิ",
    "ผู้รับอนุญาตใช้สิทธิ",
    "สำนักพิมพ์ / ค่าย",
    "แพลตฟอร์มดิจิทัล",
  ],
  agriculture: [
    "เกษตร / ปศุสัตว์ / ประมง",
    "ผู้รับซื้อ",
    "ตลาด / สหกรณ์",
    "โรงงาน / ล้ง",
  ],
  pension: [
    "บำนาญ / เงินเกษียณ",
    "กองทุนบำเหน็จบำนาญ",
    "นายจ้างเดิม",
    "หน่วยงานรัฐ",
  ],
  prize_grant: [
    "เงินรางวัล / เงินสนับสนุน",
    "ผู้จัดกิจกรรม",
    "หน่วยงานรัฐ",
    "องค์กร / มูลนิธิ",
  ],
  other: ["รายได้อื่น ๆ", "บุคคล", "องค์กร / หน่วยงาน"],
};

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

export function getIncomeSourceSuggestions(
  code: IncomeCategoryCode,
): readonly string[] {
  return INCOME_SOURCE_SUGGESTIONS[code];
}

export function getDefaultIncomeSourceSuggestion(
  code: IncomeCategoryCode,
): string {
  return INCOME_SOURCE_SUGGESTIONS[code][0] ?? getIncomeCategoryLabel(code);
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
