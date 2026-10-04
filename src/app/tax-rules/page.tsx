import { CircleAlert } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { TaxRuleSourceRegistry } from "@/components/tax-rule-source-registry";
import { Button } from "@/components/ui/button";
import { getTaxRuleSourceRegistry } from "@/tax/tax-rule-source-registry";

export default function TaxRulesPage() {
  const entries = getTaxRuleSourceRegistry();

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Button asChild variant="secondary">
            <Link href="/calculator">กลับไปดูข้อมูลของฉัน</Link>
          </Button>
        }
        description="ดูสถานะกฎภาษีและแหล่งอ้างอิงที่แอปใช้สำหรับการประมาณการในแต่ละปี ข้อมูลหน้านี้อยู่ในตัวแอปและไม่ส่งข้อมูลส่วนตัวของคุณออกไป"
        eyebrow="ข้อมูลกฎภาษี"
        title="ตรวจแหล่งอ้างอิงก่อนใช้ประมาณการ"
      />

      <aside className="border-warning/30 bg-warning-soft text-warning-strong rounded-2xl border p-4 text-sm leading-6 sm:p-5">
        <div className="flex items-start gap-3">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>
            ผลลัพธ์ของแอปเป็นเพียงการประมาณการเพื่อช่วยจัดระเบียบข้อมูล
            ไม่ใช่แบบยื่นภาษี คำรับรอง หรือคำปรึกษาเฉพาะบุคคล
            โปรดตรวจรายละเอียดกับแหล่งทางการหรือผู้เชี่ยวชาญก่อนยื่นจริง
          </p>
        </div>
      </aside>

      <TaxRuleSourceRegistry entries={entries} />
    </div>
  );
}
