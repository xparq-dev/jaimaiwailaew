"use client";

import { HardDrive, MonitorSmartphone, ShieldAlert } from "lucide-react";

import { formatThaiDateTime } from "@/calculator/utils";
import { useCalculatorStore } from "@/calculator/store";

export function LocalDataIndicator() {
  const lastSavedAt = useCalculatorStore((state) => state.lastSavedAt);

  return (
    <section
      aria-label="สถานะข้อมูลในอุปกรณ์"
      className="border-border bg-card grid gap-3 rounded-2xl border p-4 sm:grid-cols-[auto_1fr]"
    >
      <span className="bg-muted text-primary inline-grid size-10 place-items-center rounded-xl">
        <HardDrive aria-hidden="true" className="size-5" />
      </span>
      <div className="space-y-2 text-sm leading-6">
        <p className="text-foreground font-semibold">
          ข้อมูลอยู่ในอุปกรณ์นี้เท่านั้น
        </p>
        <p className="text-muted-foreground">
          ระบบไม่ส่งข้อมูลรายรับ รายจ่าย หรือยอดรวมไปยังเซิร์ฟเวอร์
        </p>
        {lastSavedAt ? (
          <p className="text-muted-foreground">
            บันทึกล่าสุดในอุปกรณ์:{" "}
            <time dateTime={lastSavedAt}>
              {formatThaiDateTime(lastSavedAt)}
            </time>
          </p>
        ) : (
          <p className="text-muted-foreground">ยังไม่มีการบันทึกในอุปกรณ์</p>
        )}
        <p className="text-warning-strong flex items-start gap-2 font-medium">
          <MonitorSmartphone
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          <span>
            ไม่ควรใช้บนเครื่องสาธารณะ การล้าง browser data อาจทำให้ข้อมูลหาย
          </span>
        </p>
      </div>
    </section>
  );
}

export function PersistErrorBanner() {
  const persistError = useCalculatorStore((state) => state.persistError);
  const dismissPersistError = useCalculatorStore(
    (state) => state.dismissPersistError,
  );
  const clearLocalData = useCalculatorStore((state) => state.clearLocalData);

  if (!persistError) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="border-warning/30 bg-warning-soft text-warning-strong rounded-2xl border p-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div className="space-y-3">
          <p className="font-semibold">{persistError}</p>
          <div className="flex flex-wrap gap-2">
            <button
              className="bg-danger hover:bg-danger/90 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              onClick={() => clearLocalData()}
              type="button"
            >
              ล้างข้อมูลในอุปกรณ์นี้
            </button>
            <button
              className="border-border bg-card hover:bg-muted rounded-xl border px-4 py-2 text-sm font-semibold"
              onClick={() => dismissPersistError()}
              type="button"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
