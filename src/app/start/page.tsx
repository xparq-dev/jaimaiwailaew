import {
  ArrowRight,
  BriefcaseBusiness,
  CircleHelp,
  Layers3,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";

const flows = [
  {
    href: "/start/pnd94",
    icon: ShoppingBag,
    title: "ขายออนไลน์ / ธุรกิจ",
    description: "โครงขั้นตอนเตรียมข้อมูลช่วงครึ่งปี",
  },
  {
    href: "/start/pnd94",
    icon: BriefcaseBusiness,
    title: "ฟรีแลนซ์",
    description: "โครงขั้นตอนจัดระเบียบรายได้และรายจ่าย",
  },
  {
    href: "/start/pnd91",
    icon: UserRound,
    title: "พนักงานประจำ",
    description: "โครงขั้นตอนข้อมูลเงินเดือนประจำปี",
  },
  {
    href: "/start/multi-income",
    icon: Layers3,
    title: "หลายประเภทรายได้",
    description: "โครงขั้นตอนรวบรวมหลายแหล่งรายได้",
  },
  {
    href: "/start/income-type",
    icon: CircleHelp,
    title: "ยังไม่แน่ใจ",
    description: "โครงคำแนะนำเพื่อเลือกเส้นทาง",
  },
] as const;

export default function StartPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="เลือกดูโครงเส้นทางตามลักษณะรายได้ได้ แต่ยังไม่มีแบบฟอร์มและยังไม่เปิดใช้การคำนวณใน Phase 0"
        eyebrow="เริ่มต้น"
        title="คุณต้องการเตรียมข้อมูลแบบไหน"
      />
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
