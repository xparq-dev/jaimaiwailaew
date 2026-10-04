import { CircleAlert } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { TaxCalendar } from "@/components/tax-calendar";
import { Button } from "@/components/ui/button";
import { getTaxCalendarEntries } from "@/tax/tax-calendar";

export default function TaxCalendarPage() {
  const entries = getTaxCalendarEntries();

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/tax-rules">ดูสถานะกฎภาษี</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/calculator">กลับไปดูข้อมูลของฉัน</Link>
            </Button>
          </>
        }
        description="ดูเฉพาะกำหนดเวลาที่ยืนยันกับกรมสรรพากรแล้ว เพื่อช่วยเตรียมเอกสารของคุณในเวลาเหมาะสม"
        eyebrow="ปฏิทินภาษี"
        title="กำหนดเวลายื่นแบบที่ตรวจสอบแล้ว"
      />

      <aside className="border-warning/30 bg-warning-soft text-warning-strong rounded-2xl border p-4 text-sm leading-6 sm:p-5">
        <div className="flex items-start gap-3">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>
            หน้านี้เป็นข้อมูลอ้างอิงแบบอ่านอย่างเดียว
            ไม่ใช่การยื่นแบบแทนหรือคำแนะนำภาษีเฉพาะบุคคล
            กำหนดเวลาอาจเปลี่ยนตามประกาศของกรมสรรพากร
            โปรดเปิดแหล่งอ้างอิงและตรวจสอบอีกครั้งก่อนยื่นจริง
          </p>
        </div>
      </aside>

      <TaxCalendar entries={entries} />
    </div>
  );
}
