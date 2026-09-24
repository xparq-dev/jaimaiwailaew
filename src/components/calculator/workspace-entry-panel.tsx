"use client";

import { FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getPersonaLabel } from "@/calculator/categories";
import { useCalculatorStore } from "@/calculator/store";
import { formatThaiDate } from "@/calculator/utils";
import { Button } from "@/components/ui/button";

import { useCalculatorHydrated } from "./calculator-hydration";

export function WorkspaceEntryPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const hydrated = useCalculatorHydrated();
  const workspace = useCalculatorStore((state) => state.workspace);
  const otherWorkspaces = useCalculatorStore((state) => state.otherWorkspaces);
  const selectWorkspace = useCalculatorStore((state) => state.selectWorkspace);
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

  const allWorkspaces = [workspace, ...otherWorkspaces];

  const openWorkspace = (workspaceId: string) => {
    selectWorkspace(workspaceId);
    router.push("/calculator");
  };

  return (
    <section
      aria-labelledby="existing-workspace-title"
      className="border-primary/25 bg-primary/5 space-y-4 rounded-2xl border p-5"
    >
      <div>
        <p className="text-primary text-xs font-semibold">
          {user
            ? `พบ ${allWorkspaces.length} Workspace สำหรับบัญชีนี้ในอุปกรณ์`
            : "พบ Workspace เดิมในอุปกรณ์นี้"}
        </p>
        <h2 className="mt-1 text-lg font-bold" id="existing-workspace-title">
          เลือก Workspace ที่ต้องการเปิด
        </h2>
      </div>

      <div className="grid gap-3">
        {allWorkspaces.map((candidate) => (
          <article
            className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
            key={candidate.id}
          >
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground grid size-10 shrink-0 place-items-center rounded-xl">
                <FolderOpen aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h3 className="font-bold">
                  {getPersonaLabel(candidate.persona)} · ปีภาษี{" "}
                  {candidate.taxYearBE}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {formatThaiDate(candidate.periodStart)} –{" "}
                  {formatThaiDate(candidate.periodEnd)}
                </p>
              </div>
            </div>
            {!user && candidate.id === workspace.id ? (
              <Button asChild>
                <Link href="/calculator">เปิด Workspace เดิม</Link>
              </Button>
            ) : (
              <Button
                onClick={() => openWorkspace(candidate.id)}
                type="button"
                variant={
                  candidate.id === workspace.id ? "default" : "secondary"
                }
              >
                {candidate.id === workspace.id
                  ? "เปิด Workspace ปัจจุบัน"
                  : "เปิด Workspace นี้"}
              </Button>
            )}
          </article>
        ))}
      </div>

      <div className="border-primary/20 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs leading-5">
          {user
            ? "บัญชีที่เข้าสู่ระบบสามารถสร้างหลาย Workspace และซิงก์ข้ามอุปกรณ์เมื่อเปิด Cloud Sync"
            : "โหมดไม่สมัครสมาชิกเก็บ Workspace ในอุปกรณ์นี้ได้ 1 รายการ"}
        </p>
        {user ? (
          <Button asChild variant="secondary">
            <Link href="/start/income-type">
              <Plus aria-hidden="true" className="size-4" />
              เพิ่ม Workspace
            </Link>
          </Button>
        ) : (
          <Button
            onClick={() => setNoticeOpen(true)}
            type="button"
            variant="secondary"
          >
            <Plus aria-hidden="true" className="size-4" />
            เพิ่ม Workspace
          </Button>
        )}
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
import { useAuth } from "@/auth/auth-provider";
