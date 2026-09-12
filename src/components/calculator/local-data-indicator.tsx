"use client";

import { HardDrive, Info, Lock, ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { formatThaiDateTime } from "@/calculator/utils";
import { useCalculatorStore } from "@/calculator/store";
import { Button } from "@/components/ui/button";

import { ClearDataDialog } from "./clear-data-dialog";

export function LocalDataIndicator() {
  const lastSavedAt = useCalculatorStore((state) => state.lastSavedAt);
  const clearLocalData = useCalculatorStore((state) => state.clearLocalData);
  const [detailOpen, setDetailOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (detailOpen) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
      closeButtonRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
      previousFocusRef.current?.focus();
    }
  }, [detailOpen]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          aria-expanded={detailOpen}
          aria-haspopup="dialog"
          aria-label="ข้อมูลบันทึกในอุปกรณ์นี้ คลิกเพื่อดูรายละเอียดความเป็นส่วนตัว"
          className="border-border bg-card/80 hover:bg-muted/70 focus-visible:ring-focus text-foreground inline-flex min-h-[44px] items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none sm:text-sm"
          onClick={() => setDetailOpen(true)}
          ref={triggerRef}
          title="ข้อมูลบันทึกในอุปกรณ์นี้เท่านั้น คลิกเพื่อดูรายละเอียด"
          type="button"
        >
          <span className="bg-primary/10 text-primary inline-grid size-5 place-items-center rounded-full">
            <Lock aria-hidden="true" className="size-3" />
          </span>
          <span className="font-medium">ข้อมูลบันทึกในอุปกรณ์นี้</span>
          {lastSavedAt ? (
            <span className="text-muted-foreground hidden text-xs sm:inline">
              (บันทึกล่าสุด {formatThaiDateTime(lastSavedAt)})
            </span>
          ) : null}
          <Info aria-hidden="true" className="text-muted-foreground size-3.5" />
        </button>
      </div>

      {/* Accessible Detail Dialog */}
      <dialog
        aria-labelledby="privacy-detail-title"
        aria-modal="true"
        className="border-border bg-card text-foreground m-auto w-[min(100%,32rem)] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/50"
        onCancel={(event) => {
          event.preventDefault();
          setDetailOpen(false);
        }}
        onClose={() => setDetailOpen(false)}
        ref={dialogRef}
      >
        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary inline-grid size-8 place-items-center rounded-lg">
                <HardDrive aria-hidden="true" className="size-4" />
              </span>
              <h2 className="text-base font-bold" id="privacy-detail-title">
                ความเป็นส่วนตัวและการจัดเก็บข้อมูล
              </h2>
            </div>
            <Button
              aria-label="ปิดกล่องรายละเอียด"
              onClick={() => setDetailOpen(false)}
              ref={closeButtonRef}
              size="icon"
              type="button"
              variant="secondary"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </div>

          <div className="text-muted-foreground space-y-3 text-sm leading-6">
            <p>ข้อมูลที่คุณกรอกจัดเก็บในเบราว์เซอร์ของอุปกรณ์นี้เท่านั้น</p>
            <p>
              ระบบในเวอร์ชันนี้ไม่ส่งรายการรายรับ รายจ่าย
              หรือข้อมูลคำนวณขึ้นไปเก็บบนเว็บไซต์
            </p>
            <p className="text-warning-strong font-medium">
              หากล้างข้อมูลเบราว์เซอร์ ใช้โหมดไม่ระบุตัวตน หรือใช้อุปกรณ์สาธารณะ
              ข้อมูลอาจสูญหายหรือผู้อื่นอาจเข้าถึงได้
            </p>
            {lastSavedAt ? (
              <p className="border-border text-foreground border-t pt-2 text-xs">
                บันทึกล่าสุดในอุปกรณ์:{" "}
                <time dateTime={lastSavedAt}>
                  {formatThaiDateTime(lastSavedAt)}
                </time>
              </p>
            ) : null}
          </div>

          <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <Link
              className="text-primary text-xs font-semibold hover:underline"
              href="/privacy"
              onClick={() => setDetailOpen(false)}
            >
              อ่านนโยบายความเป็นส่วนตัว →
            </Link>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setDetailOpen(false);
                  setClearDialogOpen(true);
                }}
                type="button"
                variant="danger"
              >
                ล้างข้อมูลในอุปกรณ์นี้
              </Button>
              <Button
                onClick={() => setDetailOpen(false)}
                type="button"
                variant="secondary"
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      </dialog>

      <ClearDataDialog
        onConfirm={() => clearLocalData()}
        onOpenChange={setClearDialogOpen}
        open={clearDialogOpen}
      />
    </>
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
