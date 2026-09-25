"use client";

import { Cloud, CloudAlert, CloudOff, LoaderCircle } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/auth/auth-provider";
import { UserAvatar } from "@/components/user-avatar";
import { useCloudSync } from "@/sync/sync-provider";

const syncLabels = {
  disabled: "ปิด Cloud Sync",
  auth_required: "รอเข้าสู่ระบบ",
  config_missing: "ยังไม่ตั้งค่า Cloud",
  offline: "รอออนไลน์",
  idle: "พร้อมซิงก์",
  syncing: "กำลังซิงก์",
  synced: "ซิงก์แล้ว",
  error: "ซิงก์ผิดพลาด",
} as const;

export function AccountControls() {
  const { status: authStatus, user } = useAuth();
  const { status: syncStatus } = useCloudSync();
  const SyncIcon =
    syncStatus === "syncing"
      ? LoaderCircle
      : syncStatus === "error"
        ? CloudAlert
        : syncStatus === "offline" || syncStatus === "disabled"
          ? CloudOff
          : Cloud;

  return (
    <Link
      aria-label={
        user
          ? `เปิดโปรไฟล์ — สถานะ Cloud Sync: ${syncLabels[syncStatus]}`
          : "เข้าสู่ระบบ"
      }
      className="border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground relative inline-flex size-11 shrink-0 items-center justify-center overflow-visible rounded-full border"
      href={user ? "/profile" : "/login"}
    >
      <UserAvatar avatarUrl={user?.avatarUrl ?? null} className="size-9" />
      {authStatus === "authenticated" ? (
        <span
          aria-hidden="true"
          className="border-background bg-card absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full border-2"
        >
          <SyncIcon
            className={`size-2.5 ${syncStatus === "error" ? "text-danger" : "text-success-strong"} ${syncStatus === "syncing" ? "animate-spin" : ""}`}
          />
        </span>
      ) : null}
    </Link>
  );
}
