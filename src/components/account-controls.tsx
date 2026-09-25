"use client";

import {
  Cloud,
  CloudAlert,
  CloudOff,
  LoaderCircle,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/auth/auth-provider";
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
    <div className="flex items-center gap-1">
      {authStatus === "authenticated" ? (
        <Link
          aria-label={`สถานะ Cloud Sync: ${syncLabels[syncStatus]}`}
          className="border-border text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-11 items-center justify-center gap-1.5 rounded-full border px-0 text-xs font-semibold xl:w-auto xl:px-2.5"
          href="/settings"
        >
          <SyncIcon
            aria-hidden="true"
            className={`size-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
          />
          <span className="hidden xl:inline">{syncLabels[syncStatus]}</span>
        </Link>
      ) : null}
      <Link
        aria-label={user ? "เปิดโปรไฟล์" : "เข้าสู่ระบบ"}
        className="border-border text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-11 items-center justify-center gap-1.5 rounded-full border px-0 text-xs font-semibold sm:w-auto sm:max-w-40 sm:px-2.5"
        href={user ? "/profile" : "/login"}
      >
        <UserRound aria-hidden="true" className="size-3.5" />
        <span className="hidden min-w-0 truncate sm:inline">
          {user?.email ?? "เข้าสู่ระบบ"}
        </span>
      </Link>
    </div>
  );
}
