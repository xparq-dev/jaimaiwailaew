import type { PlaceholderContent } from "@/components/placeholder-page";

type PlaceholderMap = Record<string, PlaceholderContent>;

export const startPlaceholders = {
  "income-type": {
    eyebrow: "เริ่มต้น · ขั้นตอนที่วางแผนไว้",
    title: "เลือกรูปแบบรายได้",
    description:
      "พื้นที่สำหรับช่วยเลือกเส้นทางตามงานและแหล่งรายได้ โดยจะใช้ภาษาที่เข้าใจง่ายและไม่ขอข้อมูลอ่อนไหวที่ไม่จำเป็น",
    plannedItems: [
      "ขายออนไลน์หรือธุรกิจ",
      "ฟรีแลนซ์",
      "พนักงานประจำ",
      "หลายประเภทรายได้",
    ],
  },
  pnd94: {
    eyebrow: "เริ่มต้น · ภ.ง.ด.94",
    title: "เตรียมข้อมูลครึ่งปี",
    description:
      "โครงหน้าสำหรับการเตรียมข้อมูลช่วงมกราคมถึงมิถุนายน ซึ่งไม่ใช่ระบบยื่นแบบอย่างเป็นทางการ",
    plannedItems: [
      "เลือกปีและช่วงเวลา",
      "อธิบายข้อมูลที่ต้องเตรียม",
      "ตรวจความครบถ้วน",
      "แสดงคำเตือนและสมมติฐาน",
    ],
  },
  pnd91: {
    eyebrow: "เริ่มต้น · ภ.ง.ด.91",
    title: "เตรียมข้อมูลเงินเดือนประจำปี",
    description:
      "โครงหน้าสำหรับรายได้จากเงินเดือน โบนัส และภาษีหัก ณ ที่จ่ายในระดับพื้นฐาน",
    plannedItems: [
      "รายได้เงินเดือน",
      "โบนัส",
      "ภาษีหัก ณ ที่จ่าย",
      "ค่าลดหย่อนเบื้องต้น",
    ],
  },
  "multi-income": {
    eyebrow: "เริ่มต้น · หลายรายได้",
    title: "เตรียมข้อมูลหลายประเภทรายได้",
    description:
      "โครงหน้าสำหรับรวบรวมหลายแหล่งรายได้ พร้อมชี้รายการที่ต้องตรวจสอบเพิ่มเติม",
    plannedItems: [
      "แยกแหล่งรายได้",
      "ทบทวนประเภทรายได้",
      "รวมยอดตามช่วงเวลา",
      "เตือนรายการที่คลุมเครือ",
    ],
  },
} as const satisfies PlaceholderMap;

export const calculatorPlaceholders = {
  income: {
    eyebrow: "เครื่องคำนวณ · รายรับ",
    title: "บันทึกรายรับ",
    description:
      "โครงหน้าสำหรับเพิ่ม แก้ไข ลบ และตรวจรายการรายรับบนอุปกรณ์ของผู้ใช้",
    plannedItems: [
      "รายการรายรับ",
      "วันที่เกิดรายการ",
      "ประเภทรายได้",
      "สถานะการตรวจสอบ",
    ],
  },
  expenses: {
    eyebrow: "เครื่องคำนวณ · รายจ่าย",
    title: "บันทึกรายจ่าย",
    description:
      "โครงหน้าสำหรับจัดกลุ่มรายจ่ายอย่างระมัดระวัง โดยไม่รับรองสิทธิหักรายจ่ายอัตโนมัติ",
    plannedItems: [
      "Likely related",
      "Needs review",
      "Personal",
      "Uncategorized",
    ],
  },
  "withholding-tax": {
    eyebrow: "เครื่องคำนวณ · ภาษีหัก ณ ที่จ่าย",
    title: "บันทึกภาษีหัก ณ ที่จ่าย",
    description:
      "โครงหน้าสำหรับรวบรวมรายการภาษีที่ถูกหักไว้และใช้ประกอบการประมาณการในอนาคต",
    plannedItems: [
      "วันที่รายการ",
      "แหล่งที่จ่าย",
      "จำนวนที่หัก",
      "คำเตือนเรื่องเอกสารประกอบ",
    ],
  },
  allowances: {
    eyebrow: "เครื่องคำนวณ · ค่าลดหย่อน",
    title: "เตรียมข้อมูลค่าลดหย่อน",
    description:
      "โครงหน้าสำหรับรายการค่าลดหย่อนพื้นฐาน โดยจะไม่แสดงวงเงินจริงจนกว่ากฎจะผ่านการตรวจสอบ",
    plannedItems: [
      "รายการพื้นฐาน",
      "หลักฐานประกอบ",
      "ขอบเขตสิทธิ",
      "สถานะการตรวจสอบ",
    ],
  },
  summary: {
    eyebrow: "เครื่องคำนวณ · สรุป",
    title: "สรุปข้อมูลเพื่อการประมาณการ",
    description:
      "โครงหน้าสำหรับแสดงยอดรวม คำเตือน สมมติฐาน และรหัสชุดกฎที่ใช้แบบเข้าถึงได้",
    plannedItems: [
      "สรุปแบบข้อความ",
      "ตารางประกอบ",
      "คำเตือนข้อมูลไม่ครบ",
      "Rule-set ID และเวอร์ชัน",
    ],
  },
  "export-pdf": {
    eyebrow: "เครื่องคำนวณ · รายงาน",
    title: "ส่งออกรายงาน PDF",
    description:
      "โครงหน้าสำหรับรายงานที่สร้างใน browser พร้อมลายน้ำและข้อจำกัดความรับผิด",
    plannedItems: [
      "เอกสาร A4 ภาษาไทย",
      "สร้างบนอุปกรณ์",
      "ลายน้ำแบบร่าง",
      "ไม่ cache เอกสารใน public cache",
    ],
  },
} as const satisfies PlaceholderMap;

export const startSlugs = Object.keys(startPlaceholders);
export const calculatorSlugs = Object.keys(calculatorPlaceholders);

export function getPlaceholder(map: PlaceholderMap, slug: string) {
  return map[slug];
}
