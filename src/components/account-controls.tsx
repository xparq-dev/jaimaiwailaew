"use client";

import {
  Cloud,
  CloudAlert,
  CloudOff,
  LoaderCircle,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const avatarUrl = user?.avatarUrl ?? null;
  const showAvatar = avatarUrl !== null && avatarUrl !== failedAvatarUrl;
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
      {showAvatar ? (
        <Image
          alt=""
          className="size-9 rounded-full object-cover"
          height={36}
          onError={() => setFailedAvatarUrl(avatarUrl)}
          referrerPolicy="no-referrer"
          src={avatarUrl}
          unoptimized
          width={36}
        />
      ) : (
        <UserRound aria-hidden="true" className="size-3.5" />
      )}
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
