"use client";

import { Cloud, RefreshCw } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/auth/auth-provider";
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
  const { status: authStatus, user } = useAuth();
  const {
    enabled,
    error: syncError,
    lastSyncedAt,
    setEnabled,
    status: syncStatus,
    syncNow,
  } = useCloudSync();
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
              และใช้ข้อมูลล่าสุดตามเวลาแก้ไข
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

      <aside className="border-border bg-muted/40 rounded-2xl border p-5 text-sm leading-6">
        <strong>ความเป็นส่วนตัว:</strong> ระบบใช้ Supabase เฉพาะการยืนยันตัวตน
        และส่งข้อมูล Workspace ไปยัง R2 ผ่าน Worker เฉพาะเมื่อเปิด Cloud Sync
        เท่านั้น คุณยังใช้งานแบบ Local-only โดยไม่เข้าสู่ระบบได้เสมอ
      </aside>
    </div>
  );
}
