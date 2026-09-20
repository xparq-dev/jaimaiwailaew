import {
  ArrowRight,
  BriefcaseBusiness,
  CircleHelp,
  HardDrive,
  Layers3,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { WorkspaceEntryPanel } from "@/components/calculator/workspace-entry-panel";

const flows = [
  {
    href: "/start/pnd94",
    icon: ShoppingBag,
    title: "ขายออนไลน์ / ธุรกิจ",
    description: "เตรียมข้อมูลสำหรับ ภ.ง.ด.94 ช่วงครึ่งปี (1 ม.ค. – 30 มิ.ย.)",
  },
  {
    href: "/start/income-type",
    icon: BriefcaseBusiness,
    title: "ฟรีแลนซ์",
    description: "จัดระเบียบรายได้และรายจ่ายจากงานบริการ",
  },
  {
    href: "/start/pnd91",
    icon: UserRound,
    title: "พนักงานประจำ",
    description: "เตรียมข้อมูลเงินเดือน โบนัส และภาษีหัก ณ ที่จ่ายประจำปี",
  },
  {
    href: "/start/multi-income",
    icon: Layers3,
    title: "หลายประเภทรายได้",
    description: "รวบรวมรายได้หลายแหล่งและแยกประเภท",
  },
  {
    href: "/start/income-type",
    icon: CircleHelp,
    title: "ยังไม่แน่ใจ",
    description: "ใช้คำถามช่วยเลือกเพื่อแนะนำเส้นทางที่เหมาะสม",
  },
] as const;

export default function StartPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="จัดระเบียบข้อมูลรายรับ รายจ่าย ภาษีหัก ณ ที่จ่าย และค่าลดหย่อนแบบร่าง โดยข้อมูลทั้งหมดจะถูกประมวลผลและบันทึกในอุปกรณ์นี้เท่านั้น ไม่มีการส่งขึ้นเซิร์ฟเวอร์"
        eyebrow="เริ่มต้นใช้งาน"
        title="เตรียมข้อมูลภาษีในอุปกรณ์ของคุณ"
      />

      <WorkspaceEntryPanel />

      {/* Privacy Notice Banner */}
      <section
        aria-label="ความเป็นส่วนตัว"
        className="border-border bg-card flex flex-col items-start justify-between gap-4 rounded-2xl border p-5 shadow-sm sm:flex-row sm:items-center"
      >
        <div className="flex items-start gap-3">
          <span className="bg-muted text-primary grid size-10 shrink-0 place-items-center rounded-xl">
            <HardDrive aria-hidden="true" className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold">ข้อมูลทำงานในอุปกรณ์ 100%</p>
            <p className="text-muted-foreground text-xs leading-5">
              ไม่ต้องสมัครสมาชิก ข้อมูลการเงินไม่ถูกส่งขึ้นอินเทอร์เน็ต
              สามารถคำนวณและสรุปยอดเลขคณิตได้ไม่จำกัด
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/start/income-type">เริ่มตั้งค่าทั้งหมด</Link>
        </Button>
      </section>

      <section
        aria-label="รูปแบบรายได้"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {flows.map(({ href, icon: Icon, title, description }) => (
          <Link
            className="group border-border bg-card hover:border-focus/50 focus-visible:ring-focus/35 rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:outline-none"
            href={href}
            key={title}
          >
            <span className="bg-muted text-primary inline-grid size-10 place-items-center rounded-xl">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  {description}
                </p>
              </div>
              <ArrowRight
                aria-hidden="true"
                className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
