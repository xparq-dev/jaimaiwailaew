/* eslint-disable @next/next/no-html-link-for-pages -- Offline links intentionally force document navigation through the cached HTML shell. */
import { CloudOff, Database, FileText, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "การใช้งานออฟไลน์" };

const capabilities = [
  {
    icon: Database,
    title: "ข้อมูลยังอยู่ในอุปกรณ์",
    description:
      "รายการรายรับ รายจ่าย และค่าลดหย่อนยังอ่านและแก้ไขจาก Local Storage โดยไม่ถูกคัดลอกเข้า PWA cache",
  },
  {
    icon: RefreshCw,
    title: "ใช้กฎภาษีที่เตรียมไว้ล่าสุด",
    description:
      "แถบสถานะออฟไลน์จะแสดงเวอร์ชันกฎและเวลาที่แคช ควรกลับมาออนไลน์เพื่อตรวจการอัปเดตก่อนใช้ผลอย่างเป็นทางการ",
  },
  {
    icon: FileText,
    title: "สร้าง PDF ในเครื่องได้",
    description:
      "เมื่อเปิดหน้าสรุปขณะออนไลน์เพื่อเตรียมไฟล์ที่จำเป็นแล้ว รายงาน PDF จะยังสร้างจากข้อมูลในอุปกรณ์โดยไม่อัปโหลดข้อมูล",
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
          PWA · Local-first
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">
          ใช้เครื่องคำนวณต่อได้เมื่อออฟไลน์
        </h1>
        <p className="text-muted-foreground mt-4 max-w-3xl leading-7">
          หลังจากเข้าเว็บออนไลน์อย่างน้อยหนึ่งครั้ง
          ระบบจะเตรียมเฉพาะหน้าและไฟล์สาธารณะที่จำเป็น ข้อมูลการเงิน บัญชี
          การซิงก์ และไฟล์ส่งออกจะไม่ถูกเก็บใน Cache Storage
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
          Cloud Sync และการเข้าสู่ระบบต้องใช้อินเทอร์เน็ต
          การเปลี่ยนแปลงที่ทำออฟไลน์จะยังอยู่ในอุปกรณ์และซิงก์ได้เมื่อกลับมาออนไลน์ตามการตั้งค่าของผู้ใช้
        </p>
      </section>
    </main>
  );
}
