"use client";

import { Clock3, Trash2 } from "lucide-react";
import { useState } from "react";

import type {
  LocalExportFormat,
  LocalExportHistoryRecord,
} from "@/export/local-export-history";

import { Button } from "../ui/button";

const FORMAT_LABELS: Record<LocalExportFormat, string> = {
  pdf: "PDF",
  xlsx: "Excel",
  csv: "CSV",
};

function formatDownloadedAt(value: string): string {
  return `${new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value))} น.`;
}

export function LocalExportHistoryPanel({
  records,
  loaded,
  storageError,
  onClear,
}: {
  readonly records: readonly LocalExportHistoryRecord[];
  readonly loaded: boolean;
  readonly storageError: boolean;
  readonly onClear: () => void;
}) {
  const [confirmingClear, setConfirmingClear] = useState(false);

  function confirmClear() {
    onClear();
    setConfirmingClear(false);
  }

  return (
    <details className="border-border bg-background mt-4 rounded-xl border">
      <summary className="focus-visible:ring-focus/35 flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:ring-3 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="text-muted-foreground size-4" />
          ประวัติการดาวน์โหลดในอุปกรณ์นี้
        </span>
        <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular-nums">
          {records.length} รายการ
        </span>
      </summary>

      <div className="border-border border-t px-4 py-4">
        <p className="text-muted-foreground text-xs leading-5">
          เก็บเฉพาะรูปแบบ เลขอ้างอิง ช่วงรายงาน แม่แบบ และเวลาดาวน์โหลดล่าสุด
          ไม่เก็บยอดเงินและไม่ซิงก์ขึ้น Cloud
        </p>

        {!loaded ? (
          <p className="text-muted-foreground mt-4 text-sm">
            กำลังอ่านประวัติจากอุปกรณ์นี้…
          </p>
        ) : records.length === 0 ? (
          <p className="text-muted-foreground mt-4 rounded-lg border border-dashed px-4 py-5 text-center text-sm">
            ยังไม่มีประวัติ ระบบจะบันทึกเมื่อคุณกดดาวน์โหลดไฟล์จริง
          </p>
        ) : (
          <ol className="border-border mt-4 divide-y rounded-lg border">
            {records.map((record) => (
              <li
                className="grid gap-2 px-3 py-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-3"
                key={`${record.format}-${record.reportReference}`}
              >
                <span className="bg-muted inline-flex w-fit rounded-md px-2 py-1 text-xs font-semibold">
                  {FORMAT_LABELS[record.format]}
                </span>
                <div className="min-w-0">
                  <p className="font-medium break-all tabular-nums">
                    {record.reportReference}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-5">
                    {record.periodLabel} · {record.templateLabel}
                  </p>
                </div>
                <time
                  className="text-muted-foreground text-xs whitespace-nowrap sm:text-right"
                  dateTime={record.downloadedAt}
                >
                  {formatDownloadedAt(record.downloadedAt)}
                </time>
              </li>
            ))}
          </ol>
        )}

        {storageError ? (
          <p className="text-danger mt-3 text-xs" role="status">
            บันทึกประวัติในอุปกรณ์นี้ไม่สำเร็จ
            แต่การดาวน์โหลดไฟล์ไม่ได้รับผลกระทบ
          </p>
        ) : null}

        {records.length > 0 ? (
          <div className="mt-4">
            {confirmingClear ? (
              <div
                className="border-danger/40 bg-danger/5 rounded-lg border p-3"
                role="alert"
              >
                <p className="text-sm font-medium">
                  ล้างประวัติการดาวน์โหลดทั้งหมดในอุปกรณ์นี้หรือไม่?
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  การล้างประวัติไม่ลบไฟล์ที่ดาวน์โหลดไว้และไม่ลบข้อมูลใน
                  Workspace
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => setConfirmingClear(false)}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={confirmClear}
                    size="sm"
                    type="button"
                    variant="danger"
                  >
                    ยืนยันล้างประวัติ
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setConfirmingClear(true)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                ล้างประวัติ
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </details>
  );
}
