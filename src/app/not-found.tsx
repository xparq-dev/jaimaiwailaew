import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="border-border bg-card mx-auto flex max-w-xl flex-col items-center rounded-3xl border p-8 text-center shadow-sm sm:p-12">
      <p className="text-secondary text-sm font-semibold">404</p>
      <h1 className="mt-2 text-3xl font-bold">ไม่พบหน้าที่คุณต้องการ</h1>
      <p className="text-muted-foreground mt-3 text-sm leading-6">
        ที่อยู่นี้อาจยังไม่อยู่ในขอบเขตของ Foundation หรือถูกย้ายไปแล้ว
      </p>
      <Button asChild className="mt-6">
        <Link href="/">กลับหน้าภาพรวม</Link>
      </Button>
    </div>
  );
}
