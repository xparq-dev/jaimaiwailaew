import { ArrowRight, BookOpenCheck } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";

const topics = [
  ["tax-basics", "พื้นฐานภาษี"],
  ["pnd94", "ภ.ง.ด.94"],
  ["pnd91", "ภ.ง.ด.91"],
  ["income-types", "ประเภทรายได้"],
  ["expenses", "รายจ่าย"],
  ["allowances", "ค่าลดหย่อน"],
  ["withholding-tax", "ภาษีหัก ณ ที่จ่าย"],
  ["tax-calendar", "ปฏิทินภาษี"],
  ["faq", "คำถามที่พบบ่อย"],
] as const;

export default function LearnPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="โครงศูนย์ความรู้สำหรับบทความที่ต้องมีแหล่งอ้างอิง วันที่ตรวจสอบ และเวอร์ชันเนื้อหา ก่อนเปิดเผยข้อมูลจริง"
        eyebrow="ศูนย์ความรู้"
        title="เรียนรู้ภาษีด้วยภาษาที่เข้าใจง่าย"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map(([slug, title]) => (
          <Link
            className="group border-border bg-card hover:border-focus/50 hover:bg-muted focus-visible:ring-focus/35 flex min-h-20 items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm transition focus-visible:ring-3 focus-visible:outline-none"
            href={`/learn/${slug}`}
            key={slug}
          >
            <span className="flex items-center gap-3">
              <BookOpenCheck
                aria-hidden="true"
                className="text-secondary size-5"
              />
              <span className="font-semibold">{title}</span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="text-muted-foreground size-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
