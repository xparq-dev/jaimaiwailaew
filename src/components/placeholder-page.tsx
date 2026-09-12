import { Clock3, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export interface PlaceholderContent {
  eyebrow: string;
  title: string;
  description: string;
  plannedItems: readonly string[];
}

export function PlaceholderPage({ content }: { content: PlaceholderContent }) {
  return (
    <div className="space-y-8">
      <PageHeader
        description={content.description}
        eyebrow={content.eyebrow}
        title={content.title}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="bg-muted text-primary rounded-xl p-2">
              <Clock3 aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-foreground font-semibold">
                ขอบเขตที่เตรียมไว้
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                หน้านี้สร้างไว้เป็น route placeholder ใน Phase 0 เท่านั้น
              </p>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {content.plannedItems.map((item) => (
              <li
                className="border-border bg-background text-foreground rounded-xl border px-4 py-3 text-sm leading-6"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <aside className="border-warning/30 bg-warning-soft text-warning-strong h-fit rounded-2xl border p-5">
          <ShieldAlert aria-hidden="true" className="size-5" />
          <h2 className="mt-3 font-semibold">ยังไม่เปิดใช้การคำนวณ</h2>
          <p className="mt-2 text-sm leading-6">
            ไม่มีอัตรา วงเงิน หรือสูตรภาษีจริงในระบบ
            ข้อมูลกฎต้องผ่านการตรวจสอบจากผู้เชี่ยวชาญก่อนเผยแพร่
          </p>
          <Button asChild className="mt-5 w-full" variant="secondary">
            <Link href="/disclaimer">อ่านข้อจำกัดความรับผิด</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
