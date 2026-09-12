"use client";

import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="border-border bg-card mx-auto flex max-w-xl flex-col items-center rounded-3xl border p-8 text-center shadow-sm sm:p-12">
      <span className="bg-warning-soft text-warning-strong grid size-12 place-items-center rounded-full">
        <CircleAlert aria-hidden="true" className="size-6" />
      </span>
      <h1 className="mt-4 text-2xl font-bold">
        เกิดข้อผิดพลาดในการแสดงหน้านี้
      </h1>
      <p className="text-muted-foreground mt-3 text-sm leading-6">
        ระบบไม่บันทึกข้อมูลทางการเงินลงใน error message
        กรุณาลองเปิดหน้านี้อีกครั้ง
      </p>
      <Button className="mt-6" onClick={reset} type="button">
        ลองอีกครั้ง
      </Button>
    </div>
  );
}
