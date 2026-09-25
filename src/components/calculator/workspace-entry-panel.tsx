"use client";

import { FolderOpen, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/auth/auth-provider";
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
  const deleteWorkspace = useCalculatorStore((state) => state.deleteWorkspace);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(
    null,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (noticeOpen) {
      dialogRef.current?.showModal();
    }
  }, [noticeOpen]);

  useEffect(() => {
    if (deletingWorkspaceId) deleteDialogRef.current?.showModal();
  }, [deletingWorkspaceId]);

  if (!hydrated || !workspace) {
    return null;
  }

  const allWorkspaces = [workspace, ...otherWorkspaces];
  const deletingWorkspace = allWorkspaces.find(
    (candidate) => candidate.id === deletingWorkspaceId,
  );

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
            <div className="flex flex-wrap gap-2">
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
              <Button
                aria-label={`ลบ Workspace ${getPersonaLabel(candidate.persona)} ปีภาษี ${candidate.taxYearBE}`}
                onClick={() => setDeletingWorkspaceId(candidate.id)}
                type="button"
                variant="danger"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                ลบ
              </Button>
            </div>
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

      <dialog
        aria-labelledby="delete-workspace-title"
        className="border-border bg-card text-foreground m-auto w-[min(100%,34rem)] rounded-2xl border p-0 shadow-xl backdrop:bg-black/50"
        onCancel={(event) => {
          event.preventDefault();
          deleteDialogRef.current?.close();
        }}
        onClose={() => setDeletingWorkspaceId(null)}
        ref={deleteDialogRef}
      >
        <div className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-bold" id="delete-workspace-title">
              ยืนยันลบ Workspace
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {deletingWorkspace
                ? `${getPersonaLabel(deletingWorkspace.persona)} · ปีภาษี ${deletingWorkspace.taxYearBE}`
                : "Workspace ที่เลือก"}
            </p>
          </div>
          <p className="border-danger/30 bg-danger/10 text-danger rounded-xl border p-3 text-sm leading-6">
            การลบจะนำรายการทั้งหมดใน Workspace นี้ออกจากอุปกรณ์
            {user
              ? " และส่งคำสั่งลบไปยัง Cloud เมื่อออนไลน์ เพื่อไม่ให้เครื่องอื่นนำข้อมูลเดิมกลับมา"
              : " การดำเนินการนี้ย้อนกลับไม่ได้"}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              onClick={() => deleteDialogRef.current?.close()}
              type="button"
              variant="secondary"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                if (!deletingWorkspaceId) return;
                deleteWorkspace(deletingWorkspaceId, Boolean(user));
                deleteDialogRef.current?.close();
              }}
              type="button"
              variant="danger"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              ยืนยันลบ Workspace
            </Button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
