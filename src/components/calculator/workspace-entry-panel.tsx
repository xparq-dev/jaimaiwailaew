"use client";

import { FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { getPersonaLabel } from "@/calculator/categories";
import { useCalculatorStore } from "@/calculator/store";
import { formatThaiDate } from "@/calculator/utils";
import { Button } from "@/components/ui/button";

import { useCalculatorHydrated } from "./calculator-hydration";

export function WorkspaceEntryPanel() {
  const hydrated = useCalculatorHydrated();
  const workspace = useCalculatorStore((state) => state.workspace);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (noticeOpen) {
      dialogRef.current?.showModal();
    }
  }, [noticeOpen]);

  if (!hydrated || !workspace) {
    return null;
  }

  return (
    <section
      aria-labelledby="existing-workspace-title"
      className="border-primary/25 bg-primary/5 space-y-4 rounded-2xl border p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="bg-primary text-primary-foreground grid size-10 shrink-0 place-items-center rounded-xl">
            <FolderOpen aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-primary text-xs font-semibold">
              พบ Workspace เดิมในอุปกรณ์นี้
            </p>
            <h2
              className="mt-1 text-lg font-bold"
              id="existing-workspace-title"
            >
              {getPersonaLabel(workspace.persona)} · ปีภาษี{" "}
              {workspace.taxYearBE}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {formatThaiDate(workspace.periodStart)} –{" "}
              {formatThaiDate(workspace.periodEnd)}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/calculator">เปิด Workspace เดิม</Link>
        </Button>
      </div>

      <div className="border-primary/20 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs leading-5">
          โหมดไม่สมัครสมาชิกเก็บ Workspace ในอุปกรณ์นี้ได้ 1 รายการ
        </p>
        <Button
          onClick={() => setNoticeOpen(true)}
          type="button"
          variant="secondary"
        >
          <Plus aria-hidden="true" className="size-4" />
          เพิ่ม Workspace
        </Button>
      </div>

      <dialog
        aria-labelledby="add-workspace-title"
        className="border-border bg-card text-foreground m-auto w-[min(100%,34rem)] rounded-2xl border p-0 shadow-xl backdrop:bg-black/50"
        onCancel={(event) => {
          event.preventDefault();
          dialogRef.current?.close();
        }}
        onClose={() => setNoticeOpen(false)}
        ref={dialogRef}
      >
        <div className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-bold" id="add-workspace-title">
              เพิ่ม Workspace ใหม่
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              ขณะนี้โหมดไม่สมัครสมาชิกเก็บได้ 1 Workspace บนอุปกรณ์นี้
              หากสร้างใหม่ ระบบจะขอให้ยืนยันก่อนแทนที่ Workspace เดิม
              และจะไม่ลบข้อมูลโดยอัตโนมัติ
            </p>
          </div>
          <p className="border-border bg-muted rounded-xl border p-3 text-xs leading-5">
            การเก็บหลาย Workspace
            จะใช้ได้สำหรับสมาชิกเมื่อระบบสมาชิกและการจัดเก็บที่ปลอดภัยพร้อมใช้งาน
            รอบนี้ยังไม่มีการส่งข้อมูลขึ้น Cloud
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              onClick={() => dialogRef.current?.close()}
              type="button"
              variant="secondary"
            >
              ยกเลิก
            </Button>
            <Button asChild>
              <Link href="/start/income-type">ไปตั้งค่า Workspace ใหม่</Link>
            </Button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
