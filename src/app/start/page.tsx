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
    description: "ตอบคำถามสั้น ๆ เพื่อเลือกประเภทข้อมูล",
  },
] as const;

export default function StartPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="เลือกประเภทข้อมูลและปีภาษีเพื่อเริ่มบันทึกรายการ"
        eyebrow="เริ่มต้นใช้งาน"
        title="สร้างชุดข้อมูลใหม่"
      />

      <WorkspaceEntryPanel />

      {/* Privacy Notice Banner */}
      <section
        aria-label="ความเป็นส่วนตัว"
        className="surface-card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="bg-success-soft text-success-strong grid size-11 shrink-0 place-items-center rounded-xl">
            <HardDrive aria-hidden="true" className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold">ข้อมูลเก็บในเครื่องนี้</p>
            <p className="text-muted-foreground text-xs leading-5">
              เริ่มใช้งานได้โดยไม่ต้องสมัครสมาชิก
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/start/income-type">เริ่มตั้งค่า</Link>
        </Button>
      </section>

      <section
        aria-label="รูปแบบรายได้"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {flows.map(({ href, icon: Icon, title, description }) => (
          <Link
            className="surface-card focus-visible:ring-focus/35 group hover:border-primary/25 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgb(8_48_41/10%)] focus-visible:ring-3 focus-visible:outline-none sm:p-6"
            href={href}
            key={title}
          >
            <span className="bg-success-soft text-success-strong inline-grid size-11 place-items-center rounded-xl transition-transform group-hover:scale-105">
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
