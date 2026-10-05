import {
  ArrowRight,
  BookOpenText,
  Calculator,
  Cloud,
  FileCheck2,
  HardDrive,
  ListPlus,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const primaryTasks = [
  {
    href: "/calculator/income",
    icon: ListPlus,
    title: "บันทึกรายการ",
    description: "เพิ่มรายรับ รายจ่าย หรือภาษีหัก ณ ที่จ่าย",
  },
  {
    href: "/calculator",
    icon: Calculator,
    title: "ดูยอดรวม",
    description: "ตรวจรายรับ รายจ่าย และยอดคงเหลือ",
  },
  {
    href: "/calculator/summary",
    icon: FileCheck2,
    title: "สรุปและส่งออก",
    description: "ดูตัวอย่างก่อนดาวน์โหลด PDF, Excel หรือ CSV",
  },
] as const;

const workflow = [
  ["01", "บันทึก", "เก็บรายการตามวันที่หรือเดือน"],
  ["02", "ตรวจสอบ", "ดูยอดรวมและรายการที่ยังไม่ครบ"],
  ["03", "เตรียมเอกสาร", "ตรวจตัวอย่างก่อนดาวน์โหลด"],
] as const;

export default function HomePage() {
  return (
    <div className="space-y-10 lg:space-y-14">
      <section className="grid gap-8 pt-2 lg:grid-cols-[minmax(0,1.08fr)_minmax(21rem,0.72fr)] lg:items-center lg:gap-14 lg:pt-8">
        <div className="max-w-3xl">
          <p className="text-success-strong inline-flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck aria-hidden="true" className="size-4" />
            เก็บข้อมูลในเครื่องนี้เป็นค่าเริ่มต้น
          </p>
          <h1 className="text-foreground mt-4 text-4xl leading-[1.15] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            รายรับ รายจ่าย และภาษี อยู่ในที่เดียว
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7 text-pretty sm:text-lg sm:leading-8">
            บันทึกรายการ ตรวจยอด และเตรียมรายงานจากข้อมูลของคุณ
            ใช้ต่อได้โดยไม่ต้องสมัครสมาชิก
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/calculator">
                เปิดข้อมูลของฉัน
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto" variant="secondary">
              <Link href="/start">ตั้งค่าครั้งแรก</Link>
            </Button>
          </div>

          <div className="text-muted-foreground mt-7 flex flex-col gap-2 text-sm sm:flex-row sm:gap-5">
            <span className="flex items-center gap-2">
              <HardDrive aria-hidden="true" className="text-secondary size-4" />
              เก็บในเครื่องนี้
            </span>
            <span className="flex items-center gap-2">
              <Cloud aria-hidden="true" className="text-secondary size-4" />
              สำรองข้อมูลได้เมื่อเข้าสู่ระบบ
            </span>
          </div>
        </div>

        <aside
          aria-labelledby="next-task-heading"
          className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm"
        >
          <div className="border-border border-b px-5 py-4 sm:px-6">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">
              ทางลัด
            </p>
            <h2 className="mt-1 text-xl font-bold" id="next-task-heading">
              เริ่มทำรายการ
            </h2>
          </div>
          <div className="divide-border divide-y">
            {primaryTasks.map(({ href, icon: Icon, title, description }) => (
              <Link
                className="focus-visible:ring-focus/35 group hover:bg-muted/60 flex items-start gap-4 px-5 py-4 transition-colors focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-inset sm:px-6"
                href={href}
                key={href}
              >
                <span className="bg-muted text-primary grid size-10 shrink-0 place-items-center rounded-xl">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{title}</span>
                  <span className="text-muted-foreground mt-1 block text-sm leading-5">
                    {description}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="text-muted-foreground mt-2 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section aria-labelledby="workflow-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-secondary text-sm font-semibold">
              ขั้นตอนใช้งาน
            </p>
            <h2 className="mt-1 text-2xl font-bold" id="workflow-heading">
              บันทึก ตรวจยอด แล้วส่งออก
            </h2>
          </div>
          <Link
            className="text-primary focus-visible:ring-focus/35 inline-flex min-h-11 items-center gap-2 self-start rounded-lg text-sm font-semibold hover:underline focus-visible:ring-3 focus-visible:outline-none"
            href="/learn"
          >
            <BookOpenText aria-hidden="true" className="size-4" />
            อ่านวิธีเตรียมข้อมูล
          </Link>
        </div>

        <ol className="border-border mt-5 grid border-y sm:grid-cols-3 sm:divide-x">
          {workflow.map(([number, title, description], index) => (
            <li
              className={`py-5 sm:px-6 ${index > 0 ? "border-border border-t sm:border-t-0" : "sm:pl-0"}`}
              key={number}
            >
              <span className="text-secondary text-xs font-bold tracking-[0.14em]">
                {number}
              </span>
              <h3 className="mt-2 font-bold">{title}</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-primary text-primary-foreground grid gap-5 rounded-2xl px-5 py-6 sm:px-7 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <span className="grid size-11 place-items-center rounded-xl bg-white/10">
          <HardDrive aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold">ข้อมูลของคุณยังอยู่ในเครื่องนี้</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 opacity-75">
            ใช้งานได้ทันทีโดยไม่ต้องสมัครสมาชิก
            หากต้องการใช้ข้อมูลหลายอุปกรณ์จึงค่อยเปิดการสำรองข้อมูล
          </p>
        </div>
        <Button asChild className="w-full lg:w-auto" variant="secondary">
          <Link href="/privacy">ดูวิธีดูแลข้อมูล</Link>
        </Button>
      </section>

      <p className="text-muted-foreground mx-auto max-w-3xl text-center text-xs leading-5">
        ผลคำนวณเป็นค่าประมาณจากข้อมูลที่บันทึก ไม่ใช่แบบยื่นภาษี
      </p>
    </div>
  );
}
