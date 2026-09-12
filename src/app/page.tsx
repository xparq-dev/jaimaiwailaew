import {
  ArrowRight,
  Blocks,
  FileCheck2,
  LaptopMinimalCheck,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

const foundationItems = [
  {
    icon: Blocks,
    title: "โครงสร้างที่ขยายต่อได้",
    description:
      "Next.js App Router, TypeScript strict, design tokens และชุดเครื่องมือทดสอบ",
  },
  {
    icon: ShieldCheck,
    title: "ความเป็นส่วนตัวตั้งแต่ฐาน",
    description:
      "ไม่มี API รับข้อมูลการเงิน ไม่มีบัญชีผู้ใช้ และไม่มี Cloud database ใน MVP 1",
  },
  {
    icon: LaptopMinimalCheck,
    title: "พร้อมทุกขนาดหน้าจอ",
    description:
      "Sidebar บน desktop, bottom navigation บนมือถือ พร้อม dark mode และ focus state",
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="border-border bg-card overflow-hidden rounded-3xl border shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
          <div className="p-6 sm:p-10 lg:p-12">
            <PageHeader
              actions={
                <>
                  <Button asChild>
                    <Link href="/start">
                      สำรวจโครงขั้นตอน
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/disclaimer">อ่านข้อจำกัดสำคัญ</Link>
                  </Button>
                </>
              }
              description="เรากำลังสร้างเครื่องมือภาษาไทยที่ช่วยจัดระเบียบข้อมูลและประมาณการภาษีอย่างรอบคอบ โดยข้อมูลการเงินใน MVP 1 ถูกออกแบบให้ประมวลผลบนอุปกรณ์ของคุณ"
              eyebrow="Phase 0 · Foundation"
              title="เริ่มจากฐานที่ปลอดภัย ก่อนเริ่มคำนวณจริง"
            />
          </div>
          <aside className="border-border bg-primary text-primary-foreground border-t p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
            <FileCheck2 aria-hidden="true" className="size-7" />
            <p className="mt-5 text-sm font-semibold tracking-[0.14em] uppercase opacity-75">
              สถานะกฎภาษี
            </p>
            <h2 className="mt-2 text-2xl font-bold">ยังไม่พร้อมเผยแพร่</h2>
            <p className="mt-3 text-sm leading-7 opacity-85">
              ชุดกฎปี 2568 และ 2569 เป็น placeholder ที่ไม่มีอัตรา วงเงิน
              หรือสูตรจริง
              และถูกบล็อกไม่ให้คำนวณจนกว่าจะผ่านการตรวจสอบโดยผู้เชี่ยวชาญ
            </p>
            <div className="mt-6 rounded-xl border border-white/20 bg-white/10 p-4 text-sm">
              <p className="font-semibold">ผลลัพธ์ในอนาคตคือ “ภาษีประมาณการ”</p>
              <p className="mt-1 leading-6 opacity-80">
                ไม่ใช่แบบยื่นภาษี ไม่ใช่คำรับรอง และไม่ใช่คำแนะนำเฉพาะบุคคล
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section aria-labelledby="foundation-heading">
        <div className="max-w-2xl">
          <p className="text-secondary text-sm font-semibold">
            รากฐานของผลิตภัณฑ์
          </p>
          <h2
            className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            id="foundation-heading"
          >
            ออกแบบเพื่อความถูกต้อง ความเป็นส่วนตัว และการเข้าถึง
          </h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {foundationItems.map(({ icon: Icon, title, description }) => (
            <article
              className="border-border bg-card rounded-2xl border p-5 shadow-sm"
              key={title}
            >
              <span className="bg-muted text-primary inline-grid size-10 place-items-center rounded-xl">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-secondary text-sm font-semibold">
              ข้อมูลอยู่กับคุณ
            </p>
            <h2 className="mt-1 text-xl font-bold">
              โครงสร้างนี้ยังไม่รับข้อมูลการเงิน
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              เมื่อเข้าสู่เฟสเครื่องคำนวณ ระบบจะต้องมีปุ่มล้างข้อมูลในอุปกรณ์
              และห้ามส่งรายการรายรับ รายจ่าย หรือยอดคำนวณไปยัง server
            </p>
          </div>
          <Button asChild className="shrink-0" variant="secondary">
            <Link href="/privacy">ดูแนวทางความเป็นส่วนตัว</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
