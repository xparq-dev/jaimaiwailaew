/* eslint-disable @next/next/no-html-link-for-pages -- Offline links intentionally force document navigation through the cached HTML shell. */
import { CloudOff, Database, FileText, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "การใช้งานออฟไลน์" };

const capabilities = [
  {
    icon: Database,
    title: "ข้อมูลยังอยู่ในอุปกรณ์",
    description:
      "รายการรายรับ รายจ่าย และค่าลดหย่อนยังเปิดดูและแก้ไขได้ตามปกติ",
  },
  {
    icon: RefreshCw,
    title: "ใช้กฎภาษีที่เตรียมไว้ล่าสุด",
    description:
      "ระบบใช้ข้อมูลกฎภาษีที่ดาวน์โหลดไว้ล่าสุด และตรวจข้อมูลใหม่เมื่อกลับมาออนไลน์",
  },
  {
    icon: FileText,
    title: "สร้าง PDF ในเครื่องได้",
    description: "รายงานสร้างจากข้อมูลในอุปกรณ์ และไม่ต้องอัปโหลดข้อมูลการเงิน",
  },
] as const;

export default function OfflinePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="border-border bg-card rounded-3xl border p-6 shadow-sm sm:p-10">
        <div className="bg-warning-soft text-warning-strong mb-6 grid size-14 place-items-center rounded-2xl">
          <CloudOff aria-hidden="true" className="size-7" />
        </div>
        <p className="text-secondary mb-2 text-sm font-bold tracking-wide uppercase">
          ขณะนี้ไม่มีอินเทอร์เน็ต
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">
          ใช้เครื่องคำนวณต่อได้เมื่อออฟไลน์
        </h1>
        <p className="text-muted-foreground mt-4 max-w-3xl leading-7">
          รายการที่บันทึกไว้ในอุปกรณ์ยังเปิดดูและแก้ไขได้
          การเข้าสู่ระบบและการสำรองข้อมูลจะกลับมาทำงานเมื่อเชื่อมต่ออินเทอร์เน็ต
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, description }) => (
            <article
              className="border-border bg-background rounded-2xl border p-5"
              key={title}
            >
              <Icon aria-hidden="true" className="text-secondary size-5" />
              <h2 className="mt-3 font-bold">{title}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            className="bg-secondary text-secondary-foreground inline-flex min-h-11 items-center rounded-xl px-5 py-2.5 font-bold"
            href="/calculator"
          >
            เปิดเครื่องคำนวณ
          </a>
          <a
            className="border-border hover:bg-muted inline-flex min-h-11 items-center rounded-xl border px-5 py-2.5 font-bold"
            href="/offline"
          >
            ลองโหลดอีกครั้ง
          </a>
        </div>

        <p className="text-muted-foreground mt-6 text-xs leading-5">
          รายการที่แก้ไขขณะออฟไลน์จะยังอยู่ในอุปกรณ์
          และสำรองได้เมื่อกลับมาออนไลน์
        </p>
      </section>
    </main>
  );
}
