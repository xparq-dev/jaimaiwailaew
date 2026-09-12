"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface ClearDataDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
}

export function ClearDataDialog({
  open,
  onOpenChange,
  onConfirm,
}: ClearDataDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
      cancelRef.current?.focus();
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <dialog
        aria-labelledby="clear-data-title"
        aria-modal="true"
        className="border-border bg-card text-foreground m-auto w-[min(100%,28rem)] rounded-2xl border p-0 shadow-xl backdrop:bg-black/50"
        onCancel={(event) => {
          event.preventDefault();
          onOpenChange(false);
        }}
        onClose={() => onOpenChange(false)}
        ref={dialogRef}
      >
        <form
          className="space-y-5 p-6"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm();
            onOpenChange(false);
            setAnnouncement("ล้างข้อมูลในอุปกรณ์เรียบร้อยแล้ว");
            previousFocusRef.current?.focus();
          }}
        >
          <div>
            <h2 className="text-lg font-bold" id="clear-data-title">
              ล้างข้อมูลในอุปกรณ์นี้
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              การดำเนินการนี้จะลบ workspace, รายรับ, รายจ่าย, ภาษีหัก ณ ที่จ่าย
              และค่าลดหย่อนแบบร่างทั้งหมดจาก browser นี้ และไม่สามารถกู้คืนได้
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              onClick={() => {
                onOpenChange(false);
                previousFocusRef.current?.focus();
              }}
              ref={cancelRef}
              type="button"
              variant="secondary"
            >
              ยกเลิก
            </Button>
            <Button type="submit" variant="danger">
              ยืนยันล้างข้อมูล
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
