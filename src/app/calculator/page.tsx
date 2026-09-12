import {
  Banknote,
  FileDown,
  Percent,
  ReceiptText,
  ScrollText,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";

const sections = [
  ["/calculator/income", Banknote, "รายรับ"],
  ["/calculator/expenses", ReceiptText, "รายจ่าย"],
  ["/calculator/withholding-tax", Percent, "ภาษีหัก ณ ที่จ่าย"],
  ["/calculator/allowances", WalletCards, "ค่าลดหย่อน"],
  ["/calculator/summary", ScrollText, "สรุป"],
  ["/calculator/export-pdf", FileDown, "รายงาน PDF"],
] as const;

export default function CalculatorPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="พื้นที่ส่วนต่าง ๆ ถูกจัดโครงไว้แล้ว แต่ engine ยังไม่มีสูตรหรือชุดกฎที่อนุมัติ จึงยังไม่รับข้อมูลและไม่แสดงผลคำนวณ"
        eyebrow="เครื่องคำนวณ"
        title="โครงพื้นที่จัดเตรียมข้อมูล"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(([href, Icon, label], index) => (
          <Link
            className="border-border bg-card hover:border-focus/50 hover:bg-muted focus-visible:ring-focus/35 flex min-h-24 items-center gap-4 rounded-2xl border p-5 shadow-sm transition focus-visible:ring-3 focus-visible:outline-none"
            href={href}
            key={href}
          >
            <span className="bg-muted text-primary grid size-10 shrink-0 place-items-center rounded-xl">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span>
              <span className="text-muted-foreground block text-xs">
                ส่วนที่ {index + 1}
              </span>
              <span className="font-semibold">{label}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
