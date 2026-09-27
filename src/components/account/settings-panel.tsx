"use client";

import { Cloud, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { useAuth } from "@/auth/auth-provider";
import { useCalculatorStore } from "@/calculator/store";
import { Button } from "@/components/ui/button";
import { isCloudSyncConfigured } from "@/sync/cloud-api";
import { useCloudSync } from "@/sync/sync-provider";

const syncLabels = {
  disabled: "ปิดอยู่",
  auth_required: "ต้องเข้าสู่ระบบ",
  config_missing: "ยังไม่ได้ตั้งค่า Cloud API",
  offline: "ออฟไลน์ — จะลองใหม่เมื่อออนไลน์",
  idle: "พร้อมซิงก์",
  syncing: "กำลังซิงก์…",
  synced: "ซิงก์แล้ว",
  error: "ซิงก์ไม่สำเร็จ",
} as const;

export function SettingsPanel() {
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const { status: authStatus, user } = useAuth();
  const {
    deleteCloudData,
    enabled,
    error: syncError,
    lastSyncedAt,
    setEnabled,
    status: syncStatus,
    syncNow,
  } = useCloudSync();
  const workspaceCount = useCalculatorStore(
    (state) => (state.workspace ? 1 : 0) + state.otherWorkspaces.length,
  );
  const pendingDeletionCount = useCalculatorStore(
    (state) => state.pendingWorkspaceDeletionIds.length,
  );

  async function handleDeleteCloudData() {
    setDeletePending(true);
    setDeleteError(null);
    setDeleteNotice(null);
    try {
      await deleteCloudData();
      setDeleteNotice(
        "ลบสำเนา Cloud แล้ว ข้อมูล Workspace ในอุปกรณ์นี้ยังอยู่ครบและ Cloud Sync ถูกปิดแล้ว",
      );
      deleteDialogRef.current?.close();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "ไม่สามารถลบสำเนา Cloud ได้ กรุณาลองอีกครั้ง",
      );
    } finally {
      setDeletePending(false);
    }
  }
  if (authStatus === "loading") {
    return <p role="status">กำลังโหลดการตั้งค่า…</p>;
  }

  if (!user) {
    return (
      <section className="border-border bg-card rounded-2xl border p-6 shadow-sm">
        <p className="text-muted-foreground leading-7">
          Cloud Sync เป็นฟีเจอร์สำหรับสมาชิก กรุณาเข้าสู่ระบบก่อนตั้งค่า
        </p>
        <Button asChild className="mt-5">
          <Link href="/login">เข้าสู่ระบบ</Link>
        </Button>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="border-border bg-card rounded-2xl border p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Cloud aria-hidden="true" className="text-primary mt-0.5 size-5" />
          <div>
            <h2 className="text-lg font-bold">Cloud Sync</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              เก็บสำเนา Workspace ใน Cloudflare R2
              และใช้ข้อมูลล่าสุดตามเวลาแก้ไข ระบบจะซิงก์ Workspace ทั้งหมด
              ข้อมูลจะไม่ถูกอัปโหลดจนกว่าคุณจะเปิดสวิตช์นี้
            </p>
          </div>
        </div>

        {!isCloudSyncConfigured ? (
          <p className="text-warning-strong mt-4 text-sm" role="status">
            ระบบยังไม่ได้ตั้งค่า Cloud Sync API การใช้งาน Local-only
            เดิมยังทำงานปกติ
          </p>
        ) : null}

        <label className="mt-5 flex min-h-11 cursor-pointer items-center justify-between gap-4">
          <span className="font-semibold">เปิด Cloud Sync สำหรับบัญชีนี้</span>
          <input
            checked={enabled}
            className="size-5 accent-current"
            disabled={!isCloudSyncConfigured}
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
        </label>

        <div className="bg-muted mt-4 rounded-xl p-4 text-sm">
          <p>
            สถานะ: <strong>{syncLabels[syncStatus]}</strong>
          </p>
          <p className="text-muted-foreground mt-1">
            Workspace ในอุปกรณ์นี้: {workspaceCount} รายการ
          </p>
          {lastSyncedAt ? (
            <p className="text-muted-foreground mt-1">
              ล่าสุด:{" "}
              {new Intl.DateTimeFormat("th-TH", {
                dateStyle: "medium",
                timeStyle: "medium",
                timeZone: "Asia/Bangkok",
              }).format(new Date(lastSyncedAt))}
            </p>
          ) : null}
          {syncError ? <p className="text-danger mt-2">{syncError}</p> : null}
          {pendingDeletionCount > 0 ? (
            <p className="text-warning-strong mt-2">
              รอส่งคำสั่งลบไปยัง Cloud: {pendingDeletionCount} Workspace
            </p>
          ) : null}
          {!enabled ? (
            <p className="text-warning-strong mt-2">
              อุปกรณ์นี้ยังไม่ส่งหรือดึง Workspace จาก Cloud กรุณาเปิด Cloud
              Sync บนอุปกรณ์แต่ละเครื่องที่ต้องการใช้งานร่วมกัน
            </p>
          ) : null}
        </div>

        <Button
          className="mt-4"
          disabled={!enabled || syncStatus === "syncing"}
          onClick={() => void syncNow()}
          type="button"
          variant="secondary"
        >
          <RefreshCw
            aria-hidden="true"
            className={`size-4 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
          />
          {syncStatus === "error" ? "ลองอีกครั้ง" : "ซิงก์ตอนนี้"}
        </Button>
      </section>

      <section className="border-border bg-card rounded-2xl border p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Trash2 aria-hidden="true" className="text-danger mt-0.5 size-5" />
          <div>
            <h2 className="text-lg font-bold">ลบสำเนาข้อมูลบน Cloud</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              การปิด Cloud Sync จะหยุดส่งและดึงข้อมูล
              แต่ไม่ลบสำเนาที่เคยซิงก์ไว้ หากไม่ต้องการเก็บสำเนาบน Cloud แล้ว
              คุณสามารถลบข้อมูลของบัญชีนี้ได้จากที่นี่
            </p>
          </div>
        </div>

        <div className="border-border bg-muted/40 mt-4 rounded-xl border p-4 text-sm leading-6">
          <p>
            ระบบจะลบ Workspace และประวัติคำสั่งลบที่เก็บใน Cloud ของบัญชีนี้
            พร้อมปิด Cloud Sync บนอุปกรณ์นี้
          </p>
          <p className="text-muted-foreground mt-1">
            ข้อมูลในอุปกรณ์นี้จะไม่ถูกลบ และสามารถเปิด Cloud Sync
            ใหม่ภายหลังเพื่อสร้างสำเนาใหม่ได้
          </p>
          <p className="text-warning-strong mt-2">
            หากต้องการให้ Cloud ว่างต่อเนื่อง ควรปิด Cloud Sync
            บนอุปกรณ์อื่นก่อน เพราะอุปกรณ์ที่ยังเปิด Sync อาจสร้างสำเนาใหม่
          </p>
        </div>

        {deleteNotice ? (
          <p
            className="bg-success-soft text-success-strong mt-4 rounded-xl border border-current/20 p-3 text-sm leading-6"
            role="status"
          >
            {deleteNotice}
          </p>
        ) : null}

        <Button
          className="mt-4"
          disabled={!isCloudSyncConfigured || syncStatus === "syncing"}
          onClick={() => {
            setDeleteError(null);
            deleteDialogRef.current?.showModal();
          }}
          type="button"
          variant="danger"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          ลบสำเนา Cloud ทั้งหมด
        </Button>
      </section>

      <aside className="border-border bg-muted/40 rounded-2xl border p-5 text-sm leading-6">
        <strong>ความเป็นส่วนตัว:</strong> ระบบใช้ Supabase เฉพาะการยืนยันตัวตน
        และส่งข้อมูล Workspace ไปยัง R2 ผ่าน Worker เฉพาะเมื่อเปิด Cloud Sync
        เท่านั้น คุณต้องเปิด Cloud Sync แยกในแต่ละอุปกรณ์ และยังใช้งานแบบ
        Local-only โดยไม่เข้าสู่ระบบได้เสมอ
      </aside>

      <dialog
        aria-labelledby="delete-cloud-data-title"
        className="border-border bg-card text-foreground m-auto w-[min(100%,34rem)] rounded-2xl border p-0 shadow-xl backdrop:bg-black/50"
        onCancel={(event) => {
          if (deletePending) {
            event.preventDefault();
            return;
          }
          setDeleteError(null);
        }}
        onClose={() => setDeleteError(null)}
        ref={deleteDialogRef}
      >
        <div className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-bold" id="delete-cloud-data-title">
              ยืนยันลบสำเนา Cloud
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              การดำเนินการนี้ลบเฉพาะสำเนาของบัญชีที่เก็บบน Cloud
              ไม่ได้ลบบัญชีสมาชิก และไม่ลบ Workspace ในอุปกรณ์นี้
            </p>
          </div>
          <p className="border-danger/30 bg-danger/10 text-danger rounded-xl border p-3 text-sm leading-6">
            ควรปิด Cloud Sync บนอุปกรณ์อื่นก่อนดำเนินการ อุปกรณ์ที่ยังเปิด Sync
            อาจอัปโหลดข้อมูลและสร้างสำเนาใหม่หลังการลบ
          </p>
          {deleteError ? (
            <p className="text-danger text-sm" role="alert">
              {deleteError}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              disabled={deletePending}
              onClick={() => deleteDialogRef.current?.close()}
              type="button"
              variant="secondary"
            >
              ยกเลิก
            </Button>
            <Button
              disabled={deletePending}
              onClick={() => void handleDeleteCloudData()}
              type="button"
              variant="danger"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {deletePending ? "กำลังลบสำเนา…" : "ยืนยันลบสำเนา Cloud"}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
