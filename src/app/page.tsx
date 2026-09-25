import {
  ArrowRight,
  Calculator,
  Cloud,
  FileDown,
  HardDrive,
  ListChecks,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: WalletCards,
    title: "สร้างพื้นที่ข้อมูล",
    description: "เลือกประเภทผู้ใช้และปีภาษีที่ต้องการจัดการ",
  },
  {
    icon: ListChecks,
    title: "บันทึกรายการสำคัญ",
    description: "รวมรายรับ รายจ่าย ภาษีหัก ณ ที่จ่าย และค่าลดหย่อน",
  },
  {
    icon: Calculator,
    title: "ตรวจภาพรวม",
    description: "ดูยอดสรุปและประมาณการก่อนส่งออกเอกสาร",
  },
] as const;

const capabilities = [
  {
    icon: ListChecks,
    title: "ข้อมูลครบในที่เดียว",
    description: "แยกรายรับ รายจ่าย แหล่งรายได้ และค่าลดหย่อนให้ค้นและตรวจง่าย",
  },
  {
    icon: Calculator,
    title: "เห็นตัวเลขก่อนตัดสินใจ",
    description: "สรุปยอดคงเหลือ ประกันสังคม และประมาณการภาษีจากข้อมูลที่กรอก",
  },
  {
    icon: FileDown,
    title: "ตรวจตัวอย่างก่อนดาวน์โหลด",
    description:
      "เปิดดูรายงานก่อนส่งออกเป็น PDF, Excel หรือ CSV ได้จากอุปกรณ์ของคุณ",
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="border-border bg-card relative overflow-hidden rounded-3xl border shadow-sm">
        <div
          aria-hidden="true"
          className="bg-secondary absolute inset-x-0 top-0 h-1"
        />
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
          <div className="p-6 sm:p-10 lg:p-12">
            <p className="text-success-strong bg-success-soft inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold">
              <ShieldCheck aria-hidden="true" className="size-4" />
              เริ่มใช้งานแบบ Local-first
            </p>
            <h1 className="text-foreground mt-5 max-w-3xl text-3xl leading-tight font-bold tracking-tight text-balance sm:text-5xl sm:leading-tight">
              จัดข้อมูลการเงินให้เป็นเรื่องที่รับมือได้
            </h1>
            <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7 text-pretty sm:text-lg sm:leading-8">
              บันทึกรายรับ รายจ่าย และข้อมูลลดหย่อน แล้วดูภาพรวมภาษีในที่เดียว
              เพื่อให้คุณตรวจข้อมูลและเตรียมเอกสารได้อย่างมั่นใจขึ้น
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/calculator">
                  เปิดพื้นที่ข้อมูลของฉัน
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild className="w-full sm:w-auto" variant="secondary">
                <Link href="/start">ตั้งค่าครั้งแรก</Link>
              </Button>
            </div>

            <ul className="text-muted-foreground mt-7 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5">
              <li className="flex items-center gap-2">
                <HardDrive
                  aria-hidden="true"
                  className="text-secondary size-4"
                />
                ใช้ได้โดยไม่ต้องสมัครสมาชิก
              </li>
              <li className="flex items-center gap-2">
                <Cloud aria-hidden="true" className="text-secondary size-4" />
                Cloud Sync เปิดเมื่อคุณเลือกเท่านั้น
              </li>
            </ul>
          </div>

          <aside className="border-border bg-primary text-primary-foreground border-t p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
            <p className="text-sm font-semibold tracking-[0.12em] uppercase opacity-70">
              เริ่มตรงนี้
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              จากข้อมูลกระจัดกระจาย สู่ภาพรวมที่ตรวจได้
            </h2>
            <ol className="mt-7 space-y-6">
              {steps.map(({ icon: Icon, title, description }, index) => (
                <li className="flex gap-4" key={title}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">
                      <span className="mr-2 opacity-60">{index + 1}.</span>
                      {title}
                    </p>
                    <p className="mt-1 text-sm leading-6 opacity-75">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section aria-labelledby="capabilities-heading">
        <div className="max-w-2xl">
          <p className="text-secondary text-sm font-semibold">
            ทำงานตามข้อมูลจริงของคุณ
          </p>
          <h2
            className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            id="capabilities-heading"
          >
            จากการบันทึก ไปจนถึงเอกสารที่พร้อมตรวจ
          </h2>
        </div>
        <div className="border-border bg-card mt-6 grid overflow-hidden rounded-2xl border shadow-sm md:grid-cols-3 md:divide-x">
          {capabilities.map(({ icon: Icon, title, description }, index) => (
            <article
              className={`p-5 sm:p-6 ${index > 0 ? "border-border border-t md:border-t-0" : ""}`}
              key={title}
            >
              <span className="bg-muted text-primary grid size-10 place-items-center rounded-xl">
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

      <section className="border-border bg-card grid gap-6 rounded-2xl border p-5 shadow-sm sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex items-start gap-4">
          <span className="bg-success-soft text-success-strong grid size-11 shrink-0 place-items-center rounded-xl">
            <HardDrive aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold">
              ข้อมูลเริ่มต้นอยู่ในอุปกรณ์ของคุณ
            </h2>
            <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
              เครื่องคำนวณทำงานแบบ Local-first
              และใช้งานออฟไลน์ได้หลังเตรียมระบบครั้งแรก หากต้องการใช้หลายอุปกรณ์
              คุณสามารถเข้าสู่ระบบและเปิด Cloud Sync ด้วยตนเองภายหลัง
            </p>
          </div>
        </div>
        <Button asChild className="w-full lg:w-auto" variant="secondary">
          <Link href="/privacy">ดูวิธีดูแลข้อมูล</Link>
        </Button>
      </section>

      <p className="text-muted-foreground mx-auto max-w-3xl text-center text-xs leading-5">
        ผลลัพธ์เป็นการประมาณการเพื่อช่วยจัดระเบียบข้อมูล ไม่ใช่แบบยื่นภาษี
        คำรับรอง หรือคำแนะนำเฉพาะบุคคล
      </p>
    </div>
  );
}
